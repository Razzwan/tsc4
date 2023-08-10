import { beginCell, Builder, Cell, toNano } from 'ton-core';

import { compile } from '@ton-community/blueprint';
import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import '@ton-community/test-utils';

import { Task3 } from '../wrappers/Task3';
import {parseData} from '../utils/parseData';

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

    // describe('preparing string to send', () => {
    //     it('3 cells build', async () => {
    //         const res = await task3.getCellExample();
    //         expect(res).toEqual(1);
    //     });
    // });

    // describe('test replace binaries', () => {
    //     it('edge cases', async () => {
    //         const flagBinString = '111110';
    //         const replacementBinString = '111111';
    //
    //         const biteInt = parseInt(flagBinString, 2);
    //         const flagDecimal = parseInt(flagBinString, 2);
    //         const replaceDecimal = parseInt(replacementBinString, 2);
    //
    //         const cell = beginCell().storeUint(biteInt, biteInt).endCell();
    //
    //         // expect(bStr.length).toBe(2);
    //
    //         const res = await task3.getChangedLinkedList([{type: 'int', value: BigInt(flagDecimal)}, {type: 'int', value: BigInt(replaceDecimal)}, {type: 'cell', cell}]);
    //         expect(cell.bits).toEqual(1);
    //         // expect(res.beginParse()..(flagBinString.length)).toEqual(2);
    //         // expect(bitString).toEqual(3);
    //     });
    // });
});
