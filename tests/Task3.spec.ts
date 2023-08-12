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

    describe('write_data_chain', () => {
        it('write bit data to single cell', async () => {
            const cell = beginCell().storeUint(0xff, 32).storeUint(15, 45).endCell();
            const data = '1010001001010';

            const res = await task3.getWriteDataChain([
              {type: 'tuple', items: [{type: 'builder', cell}]},
              {type: 'int', value: BigInt(parseInt(data, 2))}
            ]);

            const resCell = beginCell().storeUint(0xff, 32).storeUint(15, 45).storeUint(parseInt(data, 2), data.length).endCell();
            expect(res.items[0].cell).toEqualCell(resCell);
        });

        fit('second cell appear', async () => {
            const cell = beginCell().storeUint(0xff, 32).storeUint(15, 984).endCell();
            const data = '1010001001010';

            const res = await task3.getWriteDataChain([
                {type: 'tuple', items: [{type: 'builder', cell}]},
                {type: 'int', value: BigInt(parseInt(data, 2))}
            ]);

            // const resCell = beginCell().storeUint(0xff, 32).storeUint(15, 45).storeUint(parseInt(data, 2), data.length).endCell();
            expect(res.items.length).toBe(2);
        });
    });

    // it('simplest example', async () => {
    //     const from = '10101010';
    //     const to = '11111111';
    //
    //     const target = BigInt(parseInt(from, 2));
    //     const replacement = BigInt(parseInt(to, 2));
    //
    //     const cell = beginCell().storeUint(0xff, 32).storeUint(parseInt(from, 2), from.length).endCell();
    //
    //     const cellRes = beginCell().storeUint(0xff, 32).storeUint(parseInt(to, 2), to.length).endCell();
    //
    //     const res = await task3.getChangedLinkedList([{type: 'int', value: target}, {type: 'int', value: replacement}, {type: 'cell', cell}]);
    //     expect(res).toEqualCell(cellRes);
    // });
    //
    // it('simplest example 3 times', async () => {
    //     const from = '10101010';
    //     const to = '11111111111111';
    //
    //     const target = BigInt(parseInt(from, 2));
    //     const replacement = BigInt(parseInt(to, 2));
    //
    //     const cell = beginCell().storeUint(0xff, 32).storeUint(parseInt(from + from + from, 2), from.length * 3).endCell();
    //
    //     const cellRes = beginCell().storeUint(0xff, 32).storeUint(parseInt(to + to + to, 2), to.length * 3).endCell();
    //
    //     const res = await task3.getChangedLinkedList([{type: 'int', value: target}, {type: 'int', value: replacement}, {type: 'cell', cell}]);
    //     expect(res).toEqualCell(cellRes);
    // });
    //
    // it('2 cells', async () => {
    //     const from = '110101100';
    //     const to   = '111111111';
    //
    //     const c1 = '100000000000000000000000000000000000001101';
    //     const c2 = '011000000000000000000000000000000000000000';
    //
    //     const r1 = '100000000000000000000000000000000000001111';
    //     const r2 = '111110000000000000000000000000000000000000';
    //
    //     const target = BigInt(parseInt(from, 2));
    //     const replacement = BigInt(parseInt(to, 2));
    //
    //     const cell = beginCell().storeUint(parseInt(c1, 2), c1.length).storeRef(
    //       beginCell().storeUint(parseInt(c2, 2), c2.length)
    //     ).endCell();
    //
    //     const cellRes = beginCell().storeUint(0xff, 32).storeUint(parseInt(r1, 2), r1.length).storeRef(
    //       beginCell().storeUint(0xff, 32).storeUint(parseInt(r2, 2), r2.length)
    //     ).endCell();
    //
    //     const res = await task3.getChangedLinkedList([{type: 'int', value: target}, {type: 'int', value: replacement}, {type: 'cell', cell}]);
    //     expect(res).toEqualCell(cellRes);
    // });
    //
    // it('simplest example from task description', async () => {
    //     const target = BigInt(parseInt('101110101', 2));
    //     const replacement = BigInt(parseInt('111111111', 2));
    //
    //     const v2 = '10101000111111';
    //     const cell2 = beginCell().storeUint(parseInt(v2, 2), v2.length);
    //
    //     const v1 = '10100001011';
    //     const cell1 = beginCell().storeUint(parseInt(v1, 2), v1.length).storeRef(cell2).endCell();
    //
    //     const res2 = '11111000111111';
    //     const cellRes2 = beginCell().storeUint(parseInt(res2, 2), res2.length);
    //
    //     const res1 = '10100001111';
    //     const cellRes1 = beginCell().storeUint(parseInt(res1, 2), res1.length).storeRef(cellRes2).endCell();
    //
    //     const res = await task3.getChangedLinkedList([{type: 'int', value: target}, {type: 'int', value: replacement}, {type: 'cell', cell: cell1}]);
    //     expect(res).toEqualCell(cellRes1);
    // });
});
