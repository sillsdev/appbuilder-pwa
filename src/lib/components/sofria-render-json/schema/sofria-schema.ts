// Interfaces defining the standard schema for Sofria
// Based on documentation from the proskomma-json-tools package

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
    atts: Attributes;
    content: Content;
}

export function isParagraph(block: Block): block is Paragraph {
    return block.type === 'paragraph';
}

export interface Graft extends Block {
    type: 'graft';
    new: false;

    // One of the following must be defined
    target?: string; // The ID of the sequence containing the graft content
    sequence?: Sequence; // The sequence containing the graft content

    preview_text?: string;
    atts?: Attributes;
    content: Content;
}

export interface NewGraft extends Block {
    type: 'graft';
    new: true;

    // One of the following must be defined
    subtype?: string;
    sequence?: Sequence;

    atts?: Attributes;
}

export interface ContentElement {
    type: 'mark' | 'wrapper' | 'start_milestone' | 'end_milestone' | 'graft';
    subtype?: string;
    atts?: Attributes;
    content?: Content;
    meta_content?: Content;
}

export interface Wrapper extends ContentElement {
    type: 'wrapper';
    content: Content;
}

export function isWrapper(element: ContentElement): element is Wrapper {
    return element.type === 'wrapper';
}

export interface InlineGraft extends ContentElement {
    type: 'graft';
    target?: string;
    sequence?: Sequence;
    preview_text?: string;
    new?: boolean;
}

export type Attributes = { [name: string]: boolean | string | string[] };
export type Content = (string | ContentElement)[];
