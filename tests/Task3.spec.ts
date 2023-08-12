import { beginCell, Cell, toNano } from 'ton-core';

import { compile } from '@ton-community/blueprint';
import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import '@ton-community/test-utils';

import { Task3 } from '../wrappers/Task3';

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
            const data = '1010001001010';

            const res = await task3.getWriteDataTrain(cell, data);

            const resCell = beginCell()
              .storeUint(15, 45)
              .storeUint(parseInt(data, 2), data.length)
              .endCell();
            expect(res).toEqualCell(resCell);
        });

        it('parent slice not fool', async () => {
            const cell = beginCell()
              .storeUint(15, 980)
              .endCell();
            const data = '110110101010101010001';

            const res = await task3.getWriteDataTrain(cell, data);

            const resCell = beginCell()
              .storeUint(15, 980)
              .storeUint(parseInt('1101', 2), 4)
              .storeRef(
                beginCell()
                  .storeUint(parseInt('10101010101010001', 2), '10101010101010001'.length)
              )
              .endCell();
            expect(res).toEqualCell(resCell);
        });

        it('parent slice with ref', async () => {
            const cell = beginCell()
              .storeUint(15, 984)
              .storeRef(beginCell().storeUint(32, 1000))
              .endCell();
            const data = '110110101010101010001';

            const res = await task3.getWriteDataTrain(cell, data);

            const resCell = beginCell()
              .storeUint(15, 984)
              .storeRef(
                beginCell()
                  .storeUint(32, 1000)
                  .storeUint(parseInt('1101101010101010', 2), '1101101010101010'.length)
                  .storeRef(
                    beginCell()
                      .storeUint(parseInt('10001', 2), '10001'.length)
                  )
              )
              .endCell();
            expect(res).toEqualCell(resCell);
        });

        it('parent slice exactly fool', async () => {
            const cell = beginCell()
              .storeUint(15, 984)
              .endCell();
            const data = '110110101010101010001';

            const res = await task3.getWriteDataTrain(cell, data);

            const resCell = beginCell()
              .storeUint(15, 984)
              .storeRef(
                beginCell()
                  .storeUint(parseInt(data, 2), data.length)
              )
              .endCell();
            expect(res).toEqualCell(resCell);
        });
    });

    describe('find_and_replace', () => {
        it('simplest example', async () => {
            const from = '10101010';
            const to = '11111111';

            const cell = beginCell()
              .storeUint(parseInt(from, 2), from.length)
              .endCell();

            const cellRes = beginCell()
              .storeUint(0xff, 32)
              .storeUint(parseInt(to, 2), to.length)
              .endCell();

            const res = await task3.getChangedLinkedList(from, to, cell);
            // expect(res.beginParse().loadStringTail()).toBe(1);
            expect(res).toEqualCell(cellRes);
        });

        it('simplest example - different sizes', async () => {
            const from = '10101010';
            const to = '11111111111111';

            const cell = beginCell()
              .storeUint(parseInt(from, 2), from.length)
              .endCell();

            const cellRes = beginCell()
              .storeUint(parseInt(to, 2), to.length)
              .endCell();

            const res = await task3.getChangedLinkedList(from, to, cell);
            expect(res).toEqualCell(cellRes);
        });

        it('simplest example - few entries', async () => {
            const from = '10101010'; // 8
            const to =   '111'; // 3
            const strFrom = '10101010' + '1111' + '10101010' + '1111' + '10101010';
            const strRes =  '111' + '1111' + '111' + '1111' + '111';

            const cell = beginCell()
              .storeUint(parseInt(strFrom, 2), strFrom.length)
              .endCell();

            const cellRes = beginCell()
              .storeUint(0xff, 32)
              .storeUint(parseInt(strRes, 2), strRes.length)
              .endCell();

            const res = await task3.getChangedLinkedList(from, to, cell);
            // expect(res.beginParse().skip(32).loadUint(strRes.length-4).toString(2)).toEqual(1);
            expect(res).toEqualCell(cellRes);
        });

        it('one long cell', async () => {
            const from = '101110101';
            const to = '111111111';

            const cell = beginCell()
              .storeUint(0, 973)
              // .storeUint(parseInt('10100001011', 2), '10100001011'.length)
              .endCell();

            const res = await task3.getChangedLinkedList(from, to, cell);
            expect(res).toEqualCell(cell);
        });

        it('2 cells found', async () => {
            const from = '101110101';
            const to = '111111111';

            const cell = beginCell()
              .storeUint(0, 1012)
              .storeUint(parseInt('10100001011', 2), '10100001011'.length)
              .storeRef(
                beginCell()
                  .storeUint(parseInt('10101000111111', 2), '10101000111111'.length)
              )
              .endCell();

            const cellRes = beginCell()
              .storeUint(0, 1012)
              .storeUint(parseInt('10100001111', 2), '10100001111'.length)
              .storeRef(
                beginCell()
                  .storeUint(parseInt('11111000111111', 2), '11111000111111'.length)
              )
              .endCell();

            const res = await task3.getChangedLinkedList(from, to, cell);
            expect(res).toEqualCell(cellRes);
        });
    });
});
