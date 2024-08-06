import type { Paragraph } from './sofria-schema';

export function isUsfmParagraph(paragraph: Paragraph) {
    return paragraph.subtype.split(':')[0] === 'usfm';
}

export function usfmClass(paragraph: Paragraph) {
    return paragraph.subtype.split(':')[1];
}

export interface ListItem extends Paragraph {
    subtype: 'list_item';
    atts: {
        htmlClass: string;
    };
}

export function isListItem(paragraph: Paragraph): paragraph is ListItem {
    return paragraph.subtype === 'list_item';
}
