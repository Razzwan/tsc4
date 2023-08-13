import {
	Address,
	beginCell,
	Cell,
	Contract,
	contractAddress,
	ContractProvider,
	Sender,
	SendMode, Slice, Tuple,
	TupleItemCell, TupleItemInt, TupleReader
} from 'ton-core';
import {TupleItemSlice} from 'ton-core/dist/tuple/tuple';

export type Task3Config = {};

export function task3ConfigToCell(config: Task3Config): Cell {
	return beginCell().endCell();
}

export class Task3 implements Contract {
	constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {
	}

	static createFromAddress(address: Address) {
		return new Task3(address);
	}

	static createFromConfig(config: Task3Config, code: Cell, workchain = 0) {
		const data = task3ConfigToCell(config);
		const init = {code, data};
		return new Task3(contractAddress(workchain, init), init);
	}

	async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
		await provider.internal(via, {
			value,
			sendMode: SendMode.PAY_GAS_SEPARATELY,
			body: beginCell().endCell(),
		});
	}

	async getWriteDataTrain(provider: ContractProvider, cells_train: Cell, boolData: number): Promise<Cell> {
		const result = await provider.get('write_data_train', [
			{type: 'slice', cell: cells_train},
			{type: 'int', value: BigInt(boolData)}
		]);
		return result.stack.readCell();
	}

	async getChangedLinkedList(provider: ContractProvider, boolStrFlag: string, boolValueStr: string, text: Cell): Promise<Cell> {
		const result = await provider.get('find_and_replace', [
			{type: 'int', value: BigInt(parseInt(boolStrFlag, 2))},
			{type: 'int', value: BigInt(parseInt(boolValueStr, 2))},
			{type: 'cell', cell: text},
		]);
		return result.stack.readCell();
	}
}
