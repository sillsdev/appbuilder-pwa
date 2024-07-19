import type { Wrapper } from './sofria-schema';

export interface ListItem extends Wrapper {
    subtype: 'list_item_wrapper';
    atts: {
        htmlClass: string;
    };
}

export function isListItem(wrapper: Wrapper): wrapper is ListItem {
    return wrapper.subtype === 'list_item_wrapper';
}
