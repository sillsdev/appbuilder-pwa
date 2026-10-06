import type { RenderContext } from 'proskomma-json-tools';

export function getElementUSFMType(context: RenderContext) {
    const subType = context.sequences[0].element.subType;
    return subType.startsWith('usfm:') ? subType.split(':')[1] : '';
}

export function matchUSFMElement(context: RenderContext, subType: string) {
    const usfmType = getElementUSFMType(context);
    return !!usfmType && usfmType === subType;
}
