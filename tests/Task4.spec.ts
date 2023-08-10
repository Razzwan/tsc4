import { beginCell, Cell, toNano } from 'ton-core';
import { stringToCell } from 'ton-core/dist/boc/utils/strings';

import { compile } from '@ton-community/blueprint';
import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import '@ton-community/test-utils';

import { Task4 } from '../wrappers/Task4';

function cellFromStr(str: string): Cell {
    if (str.length > 123) {
        throw new Error('out of the bound 123 maximum');
    }
    return beginCell()
      .storeUint(0, 32)
      .storeSlice(stringToCell(str).beginParse())
      .endCell()
}

describe('Task4', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Task4');
    });

    let blockchain: Blockchain;
    let task4: SandboxContract<Task4>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        task4 = blockchain.openContract(Task4.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await task4.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: task4.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and task4 are ready to use
    });

    it('caesar_cipher_encrypt shift 0', async () => {
        const cell = cellFromStr('abc');

        const res = await task4.getEncrypt([{type: 'int', value: 0n}, {type: 'cell', cell}]);

        expect(res).toEqualCell(cell);
    });

    it('caesar_cipher_encrypt shift 1 all ASCII', async () => {
        const str1 = ' !"#$%&'
          + "'"
          + '()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}';

        const str2 = '!"#$%&'
          + "'"
          + '()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';

        const cell = cellFromStr(str2);

        expect(str1.length).toBe(94);

        const res1 = await task4.getEncrypt([{type: 'int', value: 1n}, {type: 'cell', cell}]);

        expect(res1).toEqualCell(cellFromStr(str1));

        const res2 = await task4.getDecrypt([{type: 'int', value: 1n}, {type: 'cell', cell: res1}]);

        expect(res2).toEqualCell(cell);
    });

    it('caesar_cipher_encrypt shift 1 last character', async () => {
        const str1 = '~';

        const str2 = ' ';

        const cell = cellFromStr(str2);

        const res1 = await task4.getEncrypt([{type: 'int', value: 1n}, {type: 'cell', cell}]);

        // expect(res1.beginParse().loadStringTail()).toEqual('1');
        expect(res1).toEqualCell(cellFromStr(str1));

        const res2 = await task4.getDecrypt([{type: 'int', value: 1n}, {type: 'cell', cell: res1}]);

        expect(res2).toEqualCell(cell);
    });
});
