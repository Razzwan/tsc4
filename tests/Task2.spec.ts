import { Cell, toNano } from 'ton-core';

import { compile } from '@ton-community/blueprint';
import {Blockchain, printTransactionFees, SandboxContract} from '@ton-community/sandbox';
import '@ton-community/test-utils';

import { getTuple1, getTuple2, Task2 } from '../wrappers/Task2';
import { parseData } from '../utils/parseData';

function arrFromNum(num: number, val: any = 1): Array<any> {
    return Array.from({length: num}, () => val);
}

describe('Task2', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Task2');
    });

    let blockchain: Blockchain;
    let task2: SandboxContract<Task2>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        task2 = blockchain.openContract(Task2.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await task2.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: task2.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and task2 are ready to use
    });

    describe('multiply 2 tuples', () => {
        it('just simple sum', async () => {
            const res = await task2.getMultiply2Tuples([getTuple1([1, 1, 1]), getTuple1([2, 2, 2])]);
            expect(res).toBe(6);
        });

        it('just 3x3 1', async () => {
            const res = await task2.getMultiply2Tuples([getTuple1([1, 2, 3]), getTuple1([7, 9, 11])]);
            expect(res).toBe(58);
        });

        it('just 3x3 2', async () => {
            const res = await task2.getMultiply2Tuples([getTuple1([1, 2, 3]), getTuple1([8, 10, 12])]);
            expect(res).toBe(64);
        });

        it('sum is 64', async () => {
            const res = await task2.getMultiply2Tuples([
              getTuple1(arrFromNum(32, 1)),
              getTuple1(arrFromNum(32, 2))
            ]);
            expect(res).toBe(64);
        });
    });

    describe('rotate 90 degrees', () => {
        it ('rotate 90 degrees, 3x2', async () => {
            const res = await task2.getTurnTuple90([getTuple2([[7, 8], [9, 10], [11, 12]])]);
            expect(parseData(res)).toEqual([[7,9,11], [8,10,12]]);
        });
    });

    describe('multiply matrix', () => {
        it('multiply simplest matrix', async () => {
            const res = await task2.getMatrixResult([getTuple2([[1, 2, 3], [4, 5, 6]]), getTuple2([[7, 8], [9, 10], [11, 12]])]);
            expect(parseData(res)).toEqual([[58, 64], [139, 154]]);
        });

        it('4x4', async () => {
            const res = await task2.getMatrixResult([getTuple2([[1, 2, 3], [4, 5, 6], [7,8,9], [10,11,12]]), getTuple2([[7, 8], [9, 10], [11, 12]])]);
            expect(parseData(res)).toEqual([[58, 64], [139, 154], [220, 244], [301,334]]);
        });

        it('32x32', async () => {
            const m = 28;
            const res = await task2.getMatrixResult([getTuple2(arrFromNum(m, arrFromNum(m, 2))), getTuple2(arrFromNum(m, arrFromNum(m, 2000)))]);
            expect(parseData(res)).toEqual(arrFromNum(m, arrFromNum(m, m*4000)));
        });
    });
});
