import type { RenderContext } from 'proskomma-json-tools';

export function usfmType(context: RenderContext) {
    const subType = context.sequences[0].element.subType;
    return subType.startsWith('usfm:') ? subType.split(':')[1] : '';
}
