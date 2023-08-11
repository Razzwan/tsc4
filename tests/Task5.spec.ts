import { Cell, toNano } from 'ton-core';

import { compile } from '@ton-community/blueprint';
import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import '@ton-community/test-utils';

import { Task5 } from '../wrappers/Task5';
import { parseData, parseDataAsString } from '../utils/parseData';

describe('Task5', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Task5');
    });

    let blockchain: Blockchain;
    let task5: SandboxContract<Task5>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        task5 = blockchain.openContract(Task5.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await task5.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: task5.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and task5 are ready to use
    });

    it('k is 0', async () => {
        const res = await task5.getSequence([{type: 'int', value: BigInt(0)}, {type: 'int', value: BigInt(0)}]);
        expect(parseData(res)).toEqual([]);
    });

    it('k is 0 at any place', async () => {
        const res = await task5.getSequence([{type: 'int', value: BigInt(350)}, {type: 'int', value: BigInt(0)}]);
        expect(parseData(res)).toEqual([]);
    });

    it('n = 0 k = 1', async () => {
        const res = await task5.getSequence([{type: 'int', value: BigInt(0)}, {type: 'int', value: BigInt(1)}]);
        expect(parseData(res)).toEqual([0]);
    });

    it('n = 1 k = 1', async () => {
        const res = await task5.getSequence([{type: 'int', value: BigInt(1)}, {type: 'int', value: BigInt(1)}]);
        expect(parseData(res)).toEqual([1]);
    });

    it('n = 1 k = 1', async () => {
        const res = await task5.getSequence([{type: 'int', value: BigInt(1)}, {type: 'int', value: BigInt(1)}]);
        expect(parseData(res)).toEqual([1]);
    });

    it('n = 2 k = 1', async () => {
        const res = await task5.getSequence([{type: 'int', value: BigInt(2)}, {type: 'int', value: BigInt(1)}]);
        expect(parseData(res)).toEqual([1]);
    });

    it('first 3 items', async () => {
        const res = await task5.getSequence([{type: 'int', value: BigInt(0)}, {type: 'int', value: BigInt(3)}]);
        expect(parseData(res)).toEqual([0, 1, 1]);
    });

    it('first 7 items', async () => {
        const res = await task5.getSequence([{type: 'int', value: BigInt(0)}, {type: 'int', value: BigInt(7)}]);
        expect(parseData(res)).toEqual([0, 1, 1, 2, 3, 5, 8]);
    });

    it('n = 1 k = 3', async () => {
        const res = await task5.getSequence([{type: 'int', value: BigInt(1)}, {type: 'int', value: BigInt(3)}]);
        expect(parseData(res)).toEqual([1, 1, 2]);
    });

    it('n = 201 k = 4', async () => {
        const res = await task5.getSequence([{type: 'int', value: BigInt(201)}, {type: 'int', value: BigInt(4)}]);
        expect(parseDataAsString(res)).toEqual([
          '453973694165307953197296969697410619233826',
            '734544867157818093234908902110449296423351',
            '1188518561323126046432205871807859915657177',
            '1923063428480944139667114773918309212080528'
        ]);
    });

    it('n = 115 k = 255', async () => {
        const res = await task5.getSequence([{type: 'int', value: BigInt(115)}, {type: 'int', value: BigInt(255)}]);
        expect(parseData(res).length).toEqual(255);
    });
});
