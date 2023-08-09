import { Cell, toNano } from 'ton-core';

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
        const cell = new Cell();
        const hashBuffer = cell.hash();

        const res = await task1.getBranchByHash([{type: 'int', value: BigInt('0x' + hashBuffer.toString('hex'))}, {type: 'cell', cell}]);
        expect(res.toString()).toEqual(cell.toString());
    });

    it('find some nested cells', async () => {
        const targetCell = new Cell();
        const child2 = new Cell({
            refs: [targetCell],
        });
        const child3 = new Cell({
            refs: [child2],
        });
        const child4 = new Cell({
            refs: [child3],
        });

        const cellWithChildren = new Cell({
            refs: [child4],
        });

        const hashBuffer = targetCell.hash();

        const res = await task1.getBranchByHash([{type: 'int', value: BigInt('0x' + hashBuffer.toString('hex'))}, {type: 'cell', cell: cellWithChildren}]);
        expect(res.toString()).toEqual(targetCell.toString());
    });
});
