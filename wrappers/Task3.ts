import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    TupleItemCell, TupleItemInt
} from 'ton-core';
import {TupleItemSlice} from 'ton-core/dist/tuple/tuple';

export type Task3Config = {};

export function task3ConfigToCell(config: Task3Config): Cell {
    return beginCell().endCell();
}

export class Task3 implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Task3(address);
    }

    static createFromConfig(config: Task3Config, code: Cell, workchain = 0) {
        const data = task3ConfigToCell(config);
        const init = { code, data };
        return new Task3(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async getCellExample(provider: ContractProvider): Promise<any> {
        const result = await provider.get('get_cell_example', []);
        return result.stack.readCell();
    }

    async getChangedLinkedList(provider: ContractProvider, options: [TupleItemInt, TupleItemInt, TupleItemCell]): Promise<any> {
        const result = await provider.get('find_and_replace', options);
        return result.stack.readCell();
    }
}
