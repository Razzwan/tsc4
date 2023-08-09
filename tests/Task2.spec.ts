import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import {Cell, toNano} from 'ton-core';
import {getTuple1, getTuple2, parseData, Task2} from '../wrappers/Task2';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

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

    // describe('multiply 2 tuples', () => {
    //     it('just simple sum', async () => {
    //         const res = await task2.getMultiply2Tuples([getTuple1([1, 1, 1]), getTuple1([2, 2, 2])]);
    //         expect(res).toBe(6);
    //     });
    //
    //     it('just 3x3 1', async () => {
    //         const res = await task2.getMultiply2Tuples([getTuple1([1, 2, 3]), getTuple1([7, 9, 11])]);
    //         expect(res).toBe(58);
    //     });
    //
    //     it('just 3x3 2', async () => {
    //         const res = await task2.getMultiply2Tuples([getTuple1([1, 2, 3]), getTuple1([8, 10, 12])]);
    //         expect(res).toBe(64);
    //     });
    //
    //     it('sum is 64', async () => {
    //         const res = await task2.getMultiply2Tuples([
    //           getTuple1([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
    //           getTuple1([2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2])
    //         ]);
    //         expect(res).toBe(64);
    //     });
    // });

    // describe('rotate 90 degrees', () => {
    //     it ('rotate 90 degrees, 3x2', async () => {
    //         const res = await task2.getTurnTuple90([getTuple2([[7, 8], [9, 10], [11, 12]])]);
    //         expect(parseData(res)).toEqual([[7,9,11], [8,10,12]]);
    //     });
    // });

    describe('multiply matrix', () => {
        it('multiply simplest matrix', async () => {
            const res = await task2.getMatrixResult([getTuple2([[1, 2, 3], [4, 5, 6]]), getTuple2([[7, 8], [9, 10], [11, 12]])]);
            expect(parseData(res)).toEqual([[58, 64], [139, 154]]);
            // expect(parseData(res)).toEqual(1);
        });
    });
});


/**
 *
 *
 *
 * A = [[1, 2, 3],
 *      [4, 5, 6]]
 *
 * B = [[7, 8],
 *      [9, 10],
 *      [11, 12]]
 *
 * m = 2, n = 3, p = 2
 *
 * C = [[1*7 + 2*9 + 3*11, 1*8 + 2*10 + 3*12],
 *      [4*7 + 5*9 + 6*11, 4*8 + 5*10 + 6*12]]
 *
 * C = [[58, 64],
 *      [139, 154]]
 *
 *
 *
 *
 *
 *
 */
