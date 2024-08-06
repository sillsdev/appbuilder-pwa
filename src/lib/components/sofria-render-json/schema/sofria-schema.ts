// Interfaces defining the standard schema for Sofria
// Based on documentation from the proskomma-json-tools package

export type Attributes = { [name: string]: boolean | string | string[] };
export type ContentElement = string | ContentModifier | Graft;
export type Content = ContentElement[];

export interface Document {
    schema: Schema;
    metadata: object;
}

export interface FlatDocument extends Document {
    sequences: { [id: string]: Sequence };
    main_sequence_id: string;
}

export interface NestedDocument extends Document {
    sequence: Sequence;
}

export function isFlatDocument(doc: Document): doc is FlatDocument {
    return doc.schema.structure === 'flat';
}

export function isNestedDocument(doc: Document): doc is NestedDocument {
    return doc.schema.structure === 'nested';
}

export interface Schema {
    structure: 'flat' | 'nested';
    structure_version: string;
    constraints: {
        name: 'perf' | 'sofria';
        version: string;
    };
}

export interface Sequence {
    type: string;
    preview_text?: string;
    blocks: Block[];
}

export interface Block {
    type: 'paragraph' | 'graft';
}

export interface Paragraph extends Block {
    type: 'paragraph';
    subtype: string;
    atts?: Attributes;
    content: Content;
}

export function isParagraph(block: Block): block is Paragraph {
    return block.type === 'paragraph';
}

interface GraftBase extends Block {
    type: 'graft';
    new: boolean;
    atts?: Attributes;
}

export interface Graft extends GraftBase {
    new: false;

    // One of the following must be defined
    target?: string; // The ID of the sequence containing the graft content
    sequence?: Sequence; // The sequence containing the graft content

    preview_text?: string;
}

export function blockIsGraft(block: Block): block is Graft {
    return block.type === 'graft' && !(block as GraftBase).new;
}

export function contentIsGraft(element: ContentElement): element is Graft {
    return typeof element !== 'string' && blockIsGraft(element as Block);
}

export interface NewGraft extends GraftBase {
    new: true;

    // One of the following must be defined
    subtype?: string;
    sequence?: Sequence;
}

export interface ContentModifier {
    type: 'mark' | 'wrapper' | 'start_milestone' | 'end_milestone';
    subtype?: string;
    atts?: Attributes;
    content?: Content;
    meta_content?: Content;
}

export function isContentModifier(element: ContentElement): element is ContentModifier {
    return typeof element !== 'string' && !contentIsGraft(element);
}

export interface Wrapper extends ContentModifier {
    type: 'wrapper';
    content: Content;
}

export function isWrapper(element: ContentElement): element is Wrapper {
    return typeof element !== 'string' && element.type === 'wrapper';
}
