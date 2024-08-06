import { Sequence } from './sofria-schema';

export interface ListSequence extends Sequence {
    type: 'list';
}

export function isListSequence(seq: Sequence): seq is ListSequence {
    return seq.type === 'list';
}

export interface OrderedListSequence extends Sequence {
    type: 'ordered_list';
    start: string;
}

export function isOrderedListSequence(seq: Sequence): seq is OrderedListSequence {
    return seq.type === 'ordered_list';
}
