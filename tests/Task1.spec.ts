import { beginCell, Cell, toNano } from 'ton-core';

import { compile } from '@ton-community/blueprint';
import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import '@ton-community/test-utils';

import { Task1 } from '../wrappers/Task1';

describe('Task1', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Task1');
    });

    let blockchain: Blockchain;
    let task1: SandboxContract<Task1>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        task1 = blockchain.openContract(Task1.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await task1.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: task1.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and task1 are ready to use
    });

    it('find by hash if cell itself', async () => {
        const cell = beginCell().storeUint(0, 32).storeUint(62, 16).endCell();
        const hashBuffer = cell.hash();

        const res = await task1.getBranchByHash([{type: 'int', value: BigInt('0x' + hashBuffer.toString('hex'))}, {type: 'cell', cell}]);
        expect(res).toEqualCell(cell);
    });

    it('find some nested cells', async () => {
        const targetCellB = beginCell().storeUint(0, 32).storeUint(7, 32);
        const child2B = beginCell().storeUint(2, 32).storeRef(targetCellB);
        const child3B = beginCell().storeUint(3, 32).storeRef(child2B);
        const child4B = beginCell().storeUint(4, 32).storeRef(child3B);

        const cellWithChildrenB = beginCell().storeUint(0, 32).storeUint(5, 32).storeRef(child4B);

        const targetCell = targetCellB.endCell();
        const hashBuffer = targetCell.hash();
        const cellWithChildren = cellWithChildrenB.endCell();

        const res = await task1.getBranchByHash([{type: 'int', value: BigInt('0x' + hashBuffer.toString('hex'))}, {type: 'cell', cell: cellWithChildren}]);
        expect(res).toEqualCell(targetCell);
    });
});
