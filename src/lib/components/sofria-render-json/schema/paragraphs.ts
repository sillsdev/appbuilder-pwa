import type { Paragraph } from './sofria-schema';

export function isUsfmParagraph(paragraph: Paragraph) {
    return paragraph.subtype.split(':')[0] === 'usfm';
}

export function usfmClass(paragraph: Paragraph) {
    return paragraph.subtype.split(':')[1];
}

export interface ListBlock extends Paragraph {
    subtype: 'list_block';
}

export function isListBlock(block: Paragraph): block is ListBlock {
    return block.subtype === 'list_block';
}

export interface OrderedListBlock extends Paragraph {
    subtype: 'ordered_list_block';
    atts: {
        start: string;
    };
}

export function isOrderedListBlock(block: Paragraph): block is OrderedListBlock {
    return block.subtype === 'ordered_list_block';
}
