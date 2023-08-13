import { beginCell, Cell, toNano } from 'ton-core';

import { compile } from '@ton-community/blueprint';
import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import '@ton-community/test-utils';

import { Task3 } from '../wrappers/Task3';

function lg2(n: number): number {
    return Math.ceil(Math.log2(n));
}

export const zeroNum = (num: number): string => {
    return Array.from(Array(num).keys())
      .map(() => '0')
      .join('');
};

const striInEnd = (str: string, len: number) => {
    return zeroNum(len - str.length) + str;
}

const parseRes = (res: Cell) => {
    const firstLen = res.beginParse().remainingBits;
    const secondLen = (res.beginParse().loadRef() as any).beginParse().remainingBits;
    console.log('parseRes >>>>>>> ', {
        firstLen,
        secondLen,
    });
    return striInEnd(res.beginParse().loadUint(firstLen).toString(2), firstLen) + striInEnd((res.beginParse().loadRef() as any).beginParse().loadUint(secondLen).toString(2), secondLen)
}

describe('Task3', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Task3');
    });

    let blockchain: Blockchain;
    let task3: SandboxContract<Task3>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        task3 = blockchain.openContract(Task3.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await task3.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: task3.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and task3 are ready to use
    });

    describe('write_data_train', () => {
        it('write bit data to single cell', async () => {
            const cell = beginCell()
              .storeUint(15, 45)
              .endCell();
            const data = 0b1010001001010;

            const res = await task3.getWriteDataTrain(cell, data, lg2(data));

            const resCell = beginCell()
              .storeUint(15, 45)
              .storeUint(data, lg2(data))
              .endCell();
            expect(res).toEqualCell(resCell);
        });

        it('parent slice not full', async () => {
            const cell = beginCell()
              .storeUint(15, 1019)
              .endCell();
            const data = 0b110110101010101010001;

            const res = await task3.getWriteDataTrain(cell, data, lg2(data));

            const resCell = beginCell()
              .storeUint(15, 1019)
              .storeUint(0b1101, 4)
              .storeRef(
                beginCell()
                  .storeUint(0b10101010101010001, lg2(0b10101010101010001))
              )
              .endCell();
            expect(res).toEqualCell(resCell);
        });

        it('parent slice with ref', async () => {
            const cell = beginCell()
              .storeUint(15, 1023)
              .storeRef(beginCell().storeUint(32, 1007))
              .endCell();
            const data = 0b110110101010101010001;

            const res = await task3.getWriteDataTrain(cell, data, lg2(data));

            const resCell = beginCell()
              .storeUint(15, 1023)
              .storeRef(
                beginCell()
                  .storeUint(32, 1007)
                  .storeUint(0b1101101010101010, lg2(0b1101101010101010))
                  .storeRef(
                    beginCell()
                      .storeUint(0b10001, lg2(0b10001))
                  )
              )
              .endCell();
            expect(res).toEqualCell(resCell);
        });

        it('parent slice exactly full', async () => {
            const cell = beginCell()
              .storeUint(15, 1023)
              .endCell();
            const data = 0b110110101010101010001;

            const res = await task3.getWriteDataTrain(cell, data, lg2(data));

            const resCell = beginCell()
              .storeUint(15, 1023)
              .storeRef(
                beginCell()
                  .storeUint(data, lg2(data))
              )
              .endCell();
            expect(res).toEqualCell(resCell);
        });

        it('third van', async () => {
            const cell = beginCell()
              .storeUint(15, 1023)
              .storeRef(beginCell().storeUint(19, 1022))
              .endCell();
            const data = 0b101;

            const res = await task3.getWriteDataTrain(cell, data, lg2(data));

            const resCell = beginCell()
              .storeUint(15, 1023)
              .storeRef(beginCell().storeUint(19, 1022).storeUint(0b1, 1).storeRef(
                beginCell().storeUint(0b1, 2)
              ))
              .endCell();
            expect(res).toEqualCell(resCell);
        });
    });

    describe('find_and_replace', () => {
        it('simplest example', async () => {
            const from = 0b10101010;
            const to = 0b11111111;

            const cell = beginCell()
              .storeUint(from, lg2(from))
              .endCell();

            const cellRes = beginCell()
              .storeUint(to, lg2(to))
              .endCell();

            const res = await task3.getChangedLinkedList(from, to, cell);
            // expect(res.beginParse().loadStringTail()).toBe(1);
            expect(res).toEqualCell(cellRes);
        });

        it('simplest example - different sizes', async () => {
            const from = 0b10101010;
            const to = 0b11111111111111;

            const cell = beginCell()
              .storeUint(from, lg2(from))
              .endCell();

            const cellRes = beginCell()
              .storeUint(to, lg2(to))
              .endCell();

            const res = await task3.getChangedLinkedList(from, to, cell);
            expect(res).toEqualCell(cellRes);
        });

        it('simplest example - few entries', async () => {
            const from = 0b10101010; // 8
            const to =   0b111; // 3
            const strFrom = '10101010' + '1111' + '10101010' + '1111' + '10101010';
            const strRes =  '111' + '1111' + '111' + '1111' + '111';

            const cell = beginCell()
              .storeUint(parseInt(strFrom, 2), strFrom.length)
              .endCell();

            const cellRes = beginCell()
              .storeUint(parseInt(strRes, 2), strRes.length)
              .endCell();

            const res = await task3.getChangedLinkedList(from, to, cell);
            // expect(res.beginParse().skip(32).loadUint(strRes.length-4).toString(2)).toEqual(1);
            expect(res).toEqualCell(cellRes);
        });

        it('one long cell', async () => {
            const from = 0b101110101;
            const to = 0b111111111;

            const cell = beginCell()
              .storeUint(0, 973)
              // .storeUint(parseInt('10100001011', 2), '10100001011'.length)
              .endCell();

            const res = await task3.getChangedLinkedList(from, to, cell);
            expect(res).toEqualCell(cell);
        });

        it('2 cells found', async () => {
            const from = 0b101110101;
            const to = 0b111111111;

            const cell = beginCell()
              .storeUint(0, 1012)
              .storeUint(0b10100001011, lg2(0b10100001011))
              .storeRef(
                beginCell()
                  .storeUint(0b10101000111111, lg2(0b10101000111111))
              )
              .endCell();

            const cellRes = beginCell()
              .storeUint(0, 1012)
              .storeUint(0b10100001111, lg2(0b10100001111))
              .storeRef(
                beginCell()
                  .storeUint(0b11111000111111, lg2(0b11111000111111))
              )
              .endCell();

            const res = await task3.getChangedLinkedList(from, to, cell);
            expect(res).toEqualCell(cellRes);
        });

        it('if cell not full doesnt touch it length', async () => {
            const cell = beginCell()
              .storeUint(0, 3)
              .storeRef(
                beginCell()
                  .storeUint(0b1, 1).endCell()
              )
              .endCell();

            const cellRes = beginCell()
              .storeUint(0, 3)
              .storeUint(0b1, 1).endCell();

            const res = await task3.getChangedLinkedList(0b101, 0b10, cell);
            expect(res).toEqualCell(cellRes);
        });

        it('2 cells found starts with 0 and ends with 0', async () => {
            const from = 0b10001;
            const to = 0b1001;

            const cell = beginCell()
              .storeUint(0, 1021)
              .storeUint(0b10, 2)
              .storeRef(
                beginCell()
                  .storeUint(0b1000000, 9)
              )
              .endCell();

            const secondLen = 8;
            const cellRes = beginCell()
              .storeUint(0, 1021)
              .storeUint(0b10, 2)
              .storeRef(
                beginCell()
                  .storeUint(0b1000000, secondLen)
              )
              .endCell();

            const res = await task3.getChangedLinkedList(from, to, cell);

            console.log('res', parseRes(res));
            expect(res).toEqualCell(cellRes);
        });
    });
});
