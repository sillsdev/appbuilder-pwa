import type { Wrapper } from './sofria-schema';

export function makesBold(wrapper: Wrapper) {
    return ['usfm:bd', 'usfm:bdit'].includes(wrapper.subtype);
}

export function makesItalic(wrapper: Wrapper) {
    return ['usfm:it', 'usfm:bdit'].includes(wrapper.subtype);
}
