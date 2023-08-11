import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    Tuple, TupleItem, TupleReader,
} from 'ton-core';

export type Task2Config = {};

export function task2ConfigToCell(config: Task2Config): Cell {
    return beginCell().endCell();
}

export type Matrix1 = Array<number>;

export function getTuple1(arr: Matrix1): Tuple {
    return {
        type: 'tuple',
        items: arr.map((n) => ({
            type: 'int',
            value: BigInt(n),
        }))
    };
}

export type Matrix2 = Array<Array<number>>;

export function getTuple2(arr: Matrix2): Tuple {
    return {
        type: 'tuple',
        items: arr.map((numbers) => ({
            type: 'tuple',
            items: numbers.map((n) => ({
                type: 'int',
                value: BigInt(n),
            }))
        }))
    };
}

export class Task2 implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Task2(address);
    }

    static createFromConfig(config: Task2Config, code: Cell, workchain = 0) {
        const data = task2ConfigToCell(config);
        const init = { code, data };
        return new Task2(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async getTurnTuple90(provider: ContractProvider, options: [Tuple]): Promise<any> {
        const result = await provider.get('turn_tuple_90', options);
        return result.stack.readTuple();
    }

    async getMultiply2Tuples(provider: ContractProvider, options: [Tuple, Tuple]): Promise<number> {
        const result = await provider.get('mult_2_tuples', options);
        return result.stack.readNumber();
    }

    async getMatrixResult(provider: ContractProvider, options: [Tuple, Tuple]): Promise<TupleReader> {
        const result = await provider.get('matrix_multiplier', options);
        return result.stack.readTuple();
    }
}
