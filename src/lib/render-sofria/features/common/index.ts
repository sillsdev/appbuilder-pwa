import type { RenderContext } from 'proskomma-json-tools';

export function getSequence(context: RenderContext) {
    return context.sequences[0];
}

export function matchSequence(context: RenderContext, type: string) {
    return getSequence(context).type === type;
}

export function getBlock(context: RenderContext) {
    return getSequence(context).block;
}

export function matchBlock(context: RenderContext, subType: string) {
    return getBlock(context).subType === subType;
}

export function getElement(context: RenderContext) {
    return getSequence(context).element;
}

export function matchElement(context: RenderContext, subType: string) {
    return getElement(context).subType === subType;
}

export function extractClassName(el: { subType?: string }) {
    return el.subType?.split(':')[1] || el.subType || '';
}

export function extractUSFMClassName(context: RenderContext) {
    const el = getElement(context);
    return el.subType.startsWith('usfm:') ? extractClassName(el) : '';
}
