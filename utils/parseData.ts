import {Tuple, TupleItem} from 'ton-core';

export function parseData(tuple: Tuple | TupleItem): any {
    if (!tuple.type && Array.isArray((tuple as any).items)) {
        return (tuple as any).items.map((item: TupleItem) => parseData(item));
    }
    if (tuple.type === 'tuple') {
        return tuple.items.map(item => parseData(item));
    }
    if (tuple.type === 'int') {
        return Number(tuple.value);
    }

    return {};
}

export function parseDataAsString(tuple: Tuple | TupleItem): any {
    if (!tuple.type && Array.isArray((tuple as any).items)) {
        return (tuple as any).items.map((item: TupleItem) => parseDataAsString(item));
    }
    if (tuple.type === 'tuple') {
        return tuple.items.map(item => parseDataAsString(item));
    }
    if (tuple.type === 'int') {
        return tuple.value.toString();
    }

    return {};
}
