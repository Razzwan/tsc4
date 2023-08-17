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

const parseRes = (res: Cell): string => {
    const firstLen = res.beginParse().remainingBits;
    if (res.beginParse().remainingRefs) {

        console.log('parseRes >>>>>>> ', {
            firstLen,
        });
        return striInEnd(res.beginParse().loadUint(firstLen).toString(2), firstLen) + parseRes((res.beginParse().loadRef() as any));
    }

    console.log('parseRes >>>>>>> ', {
        firstLen,
    });
    return striInEnd(res.beginParse().loadUint(firstLen).toString(2), firstLen)
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

    describe('find_and_replace', () => {
        it('simplest example', async () => {
            const from = 0b101;
            const to = 0b111;

            const cell = beginCell()
              .storeUint(from, lg2(from))
              .endCell();

            const cellRes = beginCell()
              .storeUint(to, lg2(to))
              .endCell();

            const res = await task3.getChangedLinkedList(from, to, cell);
            // expect(res.beginParse().loadStringTail()).toBe(1);
            // console.log('>>>>> ', parseRes(res));
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
            // console.log('>>>>> ', parseRes(res));
            expect(res).toEqualCell(cellRes);
        });

        it('simplest example - few entries with no matches at the end', async () => {
            const from = 0b101; // 8
            const to =   0b1; // 3
            const strFrom = '101' + '111' + '101' + '111' + '101111';
            const strRes =  '1' + '111' + '1' + '111' + '1111';

            const cell = beginCell()
              .storeUint(parseInt(strFrom, 2), strFrom.length)
              .endCell();

            const cellRes = beginCell()
              .storeUint(parseInt(strRes, 2), strRes.length)
              .endCell();

            const res = await task3.getChangedLinkedList(from, to, cell);
            // expect(res.beginParse().skip(32).loadUint(strRes.length-4).toString(2)).toEqual(1);
            // console.log('>>>>> ', parseRes(res));
            expect(res).toEqualCell(cellRes);
        });

        it('one long cell', async () => {
            const from = 0b101;
            const to = 0b1;

            const cell = beginCell()
              .storeUint(0, 1023)
              .endCell();

            const res = await task3.getChangedLinkedList(from, to, cell);

            // console.log('>>>>>', parseRes(res));

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
            // console.log('>>>>>', parseRes(res));

            expect(res).toEqualCell(cellRes);
        });

        // it('if cell not full doesnt touch it length', async () => {
        //     const cell = beginCell()
        //       .storeUint(0, 3)
        //       .storeRef(
        //         beginCell()
        //           .storeUint(0b1, 1).endCell()
        //       )
        //       .endCell();
        //
        //     const cellRes = beginCell()
        //       .storeUint(0, 3)
        //       .storeUint(0b1, 1).endCell();
        //
        //     const res = await task3.getChangedLinkedList(0b101, 0b10, cell);
        //
        //     // console.log('RES >>>>>> ', parseRes(res));
        //
        //     expect(res).toEqualCell(cellRes);
        // });

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

            const cellRes = beginCell()
              .storeUint(0, 1021)
              .storeUint(0b10, 2)
              .storeRef(
                beginCell()
                  .storeUint(0b1000000, 8)
              )
              .endCell();

            const res = await task3.getChangedLinkedList(from, to, cell);

            // console.log('res', parseRes(res));
            expect(res).toEqualCell(cellRes);
        });

        it('3 cells found starts with 0 and ends with 0', async () => {
            const from = 0b10001;
            const to = 0b1001;

            const cell = beginCell()
              .storeUint(0, 1021)
              .storeUint(0b10, 2)
              .storeRef(
                beginCell()
                  .storeUint(0b1000000, 9)
                  .storeUint(1, 1014)
                  .storeRef(
                    beginCell()
                      .storeUint(1, 32)
                  )
              )
              .endCell();

            const cellRes = beginCell()
              .storeUint(0, 1021)
              .storeUint(0b10, 2)
              .storeRef(
                beginCell()
                  .storeUint(0b1000000, 8)
                  .storeUint(0, 1013)
                  .storeUint(2, 2)
                  .storeRef(
                    beginCell()
                      .storeUint(1, 31)
                  )
              )
              .endCell();

            const res = await task3.getChangedLinkedList(from, to, cell);

            // console.log('res', parseRes(res));
            expect(res).toEqualCell(cellRes);
        });

        it('2 cells with long replacement', async () => {
            const from = 0b10001;
            const to = 0b111111;

            const cell = beginCell()
              .storeUint(0, 1021)
              .storeUint(0b10, 2)
              .storeRef(
                beginCell()
                  .storeUint(0b1000000, 9)
              )
              .endCell();

            const cellRes = beginCell()
              .storeUint(0, 1021)
              .storeUint(0b11, 2)
              .storeRef(
                beginCell()
                  .storeUint(0b1111000000, lg2(0b1111000000))
              )
              .endCell();

            const res = await task3.getChangedLinkedList(from, to, cell);

            // console.log('res', parseRes(res));
            expect(res).toEqualCell(cellRes);
        });

        it('2 matches', async () => {
            const from = 0b10001;
            const to = 0b111111;

            const cell = beginCell()
              .storeUint(0, 1021)
              .storeUint(0b10, 2)
              .storeRef(
                beginCell()
                  .storeUint(0b1100010, 9)
              )
              .endCell();

            const cellRes = beginCell()
              .storeUint(0, 1021)
              .storeUint(0b11, 2)
              .storeRef(
                beginCell()
                  .storeUint(0b11111111110, 11)
              )
              .endCell();

            const res = await task3.getChangedLinkedList(from, to, cell);

            // console.log('res', parseRes(res));
            expect(res).toEqualCell(cellRes);
        });

        it('flag is 1', async () => {
            const from = 0b1;
            const value = 0b111;

            const cell = beginCell()
              .storeUint(0b1, 1)
              .endCell();

            const cellRes = beginCell()
              .storeUint(0b111, 3)
              .endCell();

            const res = await task3.getChangedLinkedList(from, value, cell);

            // console.log('>>>>>>', parseRes(res));
            expect(res).toEqualCell(cellRes);
        });

        it('middle empty cell', async () => {
            const from = 0b1;
            const value = 0b111;

            const cell = beginCell()
              .storeUint(0b1, 1)
              .storeRef(beginCell().storeRef(beginCell().storeUint(0b1, 1)))
              .endCell();

            const cellRes = beginCell()
              .storeUint(0b111111, 6)
              .endCell();

            const res = await task3.getChangedLinkedList(from, value, cell);
            // console.log('>>>>> ', parseRes(res));
            expect(res).toEqualCell(cellRes);
        });

        it('first is empty cell', async () => {
            const from = 0b1;
            const value = 0b111;

            const cell = beginCell()
              .storeRef(beginCell().storeRef(beginCell().storeUint(0b1, 1)))
              .endCell();

            const cellRes = beginCell()
              .storeUint(0b111, 3)
              .endCell();

            const res = await task3.getChangedLinkedList(from, value, cell);
            // console.log('>>>>> ', parseRes(res));
            expect(res).toEqualCell(cellRes);
        });

        it('first short second long', async () => {
            const from = 0b1;
            const value = 0b111;

            const cell = beginCell()
              .storeUint(0, 3)
              .storeRef(beginCell().storeUint(1, 1).storeUint(0, 1022))
              .endCell();

            const cellRes = beginCell()
              .storeUint(0, 3)
              .storeUint(0b111, 3)
              .storeUint(0, 1017)
              .storeRef(beginCell().storeUint(0, 5))
              .endCell();

            const res = await task3.getChangedLinkedList(from, value, cell);
            // console.log('>>>>> ', parseRes(res));
            expect(res).toEqualCell(cellRes);
        });
    });

    describe('add_uint_to_builder', () => {
        it('simplest', async () => {
            const cell = beginCell().endCell();
            const put = 0b1010001001;

            const cellRes = beginCell().storeUint(put, lg2(put)).endCell();

            const res = await task3.getStoreUint(cell, put, lg2(put));

            expect(res).toEqualCell(cellRes);
        });

        it('to second cell', async () => {
            const cell = beginCell().storeUint(0, 1020).endCell();
            const put = 0b1010001001;

            const cellRes = beginCell().storeUint(0, 1020)
              .storeUint(0b101, 3)
              .storeRef(beginCell().storeUint(0b1001, 7))
              .endCell();

            const res = await task3.getStoreUint(cell, put, lg2(put));

            expect(res).toEqualCell(cellRes);
        });

        it('to third cell with full first one', async () => {
            const cell = beginCell()
              .storeUint(0, 1023)
              .storeRef(
                beginCell()
                  .storeUint(0, 1020)
              ).endCell();
            const put = 0b1010001001;

            const cellRes = beginCell()
              .storeUint(0, 1023)
              .storeRef(
                beginCell()
                  .storeUint(0, 1020)
                  .storeUint(0b101, 3)
                  .storeRef(
                    beginCell().storeUint(0b1001, 7))
              ).endCell();

            const res = await task3.getStoreUint(cell, put, lg2(put));

            expect(res).toEqualCell(cellRes);
        });
    });
});
