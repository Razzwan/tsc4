import { beginCell, Cell, toNano } from 'ton-core';
import { stringToCell } from 'ton-core/dist/boc/utils/strings';

import { compile } from '@ton-community/blueprint';
import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import '@ton-community/test-utils';

import { Task4 } from '../wrappers/Task4';

function cellFromStr(str: string, ref?: Cell, isRoot: boolean = true): Cell {
    if (str.length > 127) {
        throw new Error('out of the bound 123 maximum');
    }

    let builder = beginCell();

    if (isRoot) {
        builder = builder.storeUint(0, 32);
    }
    builder = builder.storeSlice(stringToCell(str).beginParse());

    if (ref) {
        builder = builder.storeRef(ref);
    }

    return builder.endCell();

}

const SHIFT_TO_RIGHT = true;

const d1 = [
    ' !"#$%&'
    + "'"
    + '()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}',
    '!"#$%&'
    + "'"
    + '()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~'
];

const d2 = ['~', ' '];

const d3 = ['c', 'd'];

const d4 = ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'BCDEFGHIJKLMNOPQRSTUVWXYZA'];

const d5 = ['abcdefghijklmnopqrstuvwxyz', 'bcdefghijklmnopqrstuvwxyza'];

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

    // it('caesar_cipher_encrypt shift 1 all ASCII', async () => {
    //     const str1 = SHIFT_TO_RIGHT ? d1[0] : d1[1];
    //
    //     const str2 = SHIFT_TO_RIGHT ? d1[1] : d1[0];
    //
    //     const cell = cellFromStr(str1);
    //
    //     expect(str1.length).toBe(94);
    //
    //     const res1 = await task4.getEncrypt([{type: 'int', value: 1n}, {type: 'cell', cell}]);
    //
    //     expect(res1).toEqualCell(cellFromStr(str2));
    //
    //     const res2 = await task4.getDecrypt([{type: 'int', value: 1n}, {type: 'cell', cell: res1}]);
    //
    //     expect(res2).toEqualCell(cell);
    // });

    it('caesar_cipher_encrypt shift 1 last character', async () => {
        const str1 = SHIFT_TO_RIGHT ? d5[0] : d5[1];

        const str2 = SHIFT_TO_RIGHT ? d5[1] : d5[0];

        const cell = cellFromStr(str1);

        const res1 = await task4.getEncrypt([{type: 'int', value: 1n}, {type: 'cell', cell}]);

        // expect(res1.beginParse().loadStringTail()).toEqual('1');
        expect(res1).toEqualCell(cellFromStr(str2));

        const res2 = await task4.getDecrypt([{type: 'int', value: 1n}, {type: 'cell', cell: res1}]);

        expect(res2).toEqualCell(cell);
    });

    it('caesar_cipher_encrypt shift 1 a and b', async () => {
        const str1 = SHIFT_TO_RIGHT ? d3[0] : d3[1];

        const str2 = SHIFT_TO_RIGHT ? d3[1] : d3[0];

        const cell = cellFromStr(str1);

        const res1 = await task4.getEncrypt([{type: 'int', value: 1n}, {type: 'cell', cell}]);

        // expect(cell.beginParse().loadStringTail()).toEqual('1');
        // expect(res1.beginParse().loadStringTail()).toEqual('1');
        expect(res1).toEqualCell(cellFromStr(str2));

        const res2 = await task4.getDecrypt([{type: 'int', value: 1n}, {type: 'cell', cell: res1}]);

        expect(res2).toEqualCell(cell);
    });

    it('caesar_cipher_encrypt nested strings with no changes', async () => {
        const str1 = d2[0];

        const cell_1_3 = cellFromStr(str1, undefined, false);
        const cell_1_2 = cellFromStr(str1, cell_1_3, false);
        const cell_1_1 = cellFromStr(str1, cell_1_2, true);

        const res1 = await task4.getEncrypt([{type: 'int', value: 0n}, {type: 'cell', cell: cell_1_1}]);

        expect(res1).toEqualCell(cell_1_1);

    });

    it('caesar_cipher_encrypt nested strings', async () => {
        const str1 = SHIFT_TO_RIGHT ? d5[0] : d5[1];
        const str2 = SHIFT_TO_RIGHT ? d5[1] : d5[0];

        const cell_1_3 = cellFromStr(str1, undefined, false);
        const cell_1_2 = cellFromStr(str1, cell_1_3, false);
        const cell_1_1 = cellFromStr(str1, cell_1_2, true);

        const res1 = await task4.getEncrypt([{type: 'int', value: 1n}, {type: 'cell', cell: cell_1_1}]);

        const cell_2_3 = cellFromStr(str2, undefined, false);
        const cell_2_2 = cellFromStr(str2, cell_2_3, false);
        const cell_2_1 = cellFromStr(str2, cell_2_2, true);

        expect(res1).toEqualCell(cell_2_1);

    });

    it('caesar_cipher_encrypt shift 1 upper letters only', async () => {
        const str1 = SHIFT_TO_RIGHT ? d4[0] : d4[1];

        const str2 = SHIFT_TO_RIGHT ? d4[1] : d4[0];

        const cell = cellFromStr(str1);

        const res1 = await task4.getEncrypt([{type: 'int', value: 1n}, {type: 'cell', cell}]);

        // expect(cell.beginParse().loadStringTail()).toEqual('1');
        // expect(res1.beginParse().loadStringTail()).toEqual('1');
        expect(res1).toEqualCell(cellFromStr(str2));

        const res2 = await task4.getDecrypt([{type: 'int', value: 1n}, {type: 'cell', cell: res1}]);

        expect(res2).toEqualCell(cell);
    });

    it('caesar_cipher_encrypt shift 1 lower letters only', async () => {
        const str1 = SHIFT_TO_RIGHT ? d5[0] : d5[1];

        const str2 = SHIFT_TO_RIGHT ? d5[1] : d5[0];

        const cell = cellFromStr(str1);

        const res1 = await task4.getEncrypt([{type: 'int', value: 1n}, {type: 'cell', cell}]);

        // expect(cell.beginParse().loadStringTail()).toEqual('1');
        // expect(res1.beginParse().loadStringTail()).toEqual('1');
        expect(res1).toEqualCell(cellFromStr(str2));

        const res2 = await task4.getDecrypt([{type: 'int', value: 1n}, {type: 'cell', cell: res1}]);

        expect(res2).toEqualCell(cell);
    });

    it('Hello World decode', async () => {
        const str1 = 'Khoor Zruog';

        const cell = cellFromStr(str1);

        const res1 = await task4.getDecrypt([{type: 'int', value: 29n}, {type: 'cell', cell}]);

        // expect(cell.beginParse().loadStringTail()).toEqual('1');
        // expect(res1.beginParse().loadStringTail()).toEqual('1');
        expect(res1).toEqualCell(cellFromStr('Hello World'));
    });

    it('Digits', async () => {
        const str1 = '1234567890';

        const cell = cellFromStr(str1);

        const res1 = await task4.getEncrypt([{type: 'int', value: 3n}, {type: 'cell', cell}]);

        // expect(cell.beginParse().loadStringTail()).toEqual('1');
        // expect(res1.beginParse().loadStringTail()).toEqual('1');
        expect(res1).toEqualCell(cellFromStr('1234567890'));
    });

    it('very long string', async () => {
        const str1 = `aa bbb cA
        very long string abc xyz very long string abc xyz very long string abc xyz very long string abc xyzvery long string abc xyz very long string abc xyz
        qwertyuioip[]asdfgfhgjhkjl;l';zxcxvbnmn,./
        !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\`abcdefghijklmnopqrstuvwxyz{|}~`
        ;
        const str1_1 = str1.slice(0, 123);
        const str1_2 = str1.slice(123, 250);
        const str1_3 = str1.slice(250);

        const cell = cellFromStr(str1_1, cellFromStr(str1_2, cellFromStr(str1_3, undefined, false), false), true);

        const res1 = await task4.getEncrypt([{type: 'int', value: 29n}, {type: 'cell', cell}]);

        const res2 = await task4.getDecrypt([{type: 'int', value: 29n}, {type: 'cell', cell: res1}]);

        expect(res2).toEqualCell(cell);
    });

    it('looped characters', async () => {
        const str = 'abcdefghijklmnopqrstuvwxyz';
        const cell = cellFromStr(str);

        const res1 = await task4.getEncrypt([{type: 'int', value: 78n}, {type: 'cell', cell}]);
        expect(res1).toEqualCell(cell);
    })
});
