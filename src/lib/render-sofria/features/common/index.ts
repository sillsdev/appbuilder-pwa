import type { RenderContext } from 'proskomma-json-tools';

export function getSequence(context: RenderContext) {
    return context.sequences[0];
}

export function matchSequence(context: RenderContext, type: string | RegExp) {
    const s = getSequence(context);
    return typeof type === 'string' ? s.type === type : !!s.type.match(type);
}

export function getBlock(context: RenderContext) {
    return getSequence(context).block;
}

export function matchBlock(context: RenderContext, subType: string | RegExp) {
    const b = getBlock(context);
    return typeof subType === 'string' ? b.subType === subType : !!b.subType?.match(subType);
}

export function getElement(context: RenderContext) {
    return getSequence(context).element;
}

export function matchElement(context: RenderContext, subType: string | RegExp) {
    const e = getElement(context);
    return typeof subType === 'string' ? e.subType === subType : !!e.subType.match(subType);
}

export function extractClassName(el: { subType?: string }) {
    return el.subType?.split(':')[1] || el.subType || '';
}

export function extractUSFMClassName(context: RenderContext) {
    const el = getElement(context);
    return el.subType.startsWith('usfm:') ? extractClassName(el) : '';
}
