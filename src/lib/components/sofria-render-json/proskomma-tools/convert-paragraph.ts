import {
    type Block,
    type ContentElement,
    isContentModifier,
    isNestedDocument,
    isParagraph,
    type Content,
    type Document,
    type Paragraph,
    isWrapper,
    type Wrapper
} from '../schema/sofria-schema';
import { maybeConvertList, maybeConvertOrderedList } from './convert-lists';

/**
 * Return a copy of the wrapper element with different content
 */
export function replaceContent(wrapper: Wrapper, content: Content) {
    const copy = JSON.parse(JSON.stringify(wrapper)) as Wrapper;
    copy.content = content;
    return copy;
}

export function removeMarks(content: Content): Content {
    return content
        .filter((element) => typeof element == 'string' || element.type !== 'mark')
        .map((element) =>
            isWrapper(element) && element.content
                ? replaceContent(element, removeMarks(element.content))
                : element
        );
}

export function convertHeading(paragraph: Paragraph) {
    if (paragraph.subtype.match(/usfm:\w+1/)) {
        paragraph.subtype = paragraph.subtype.slice(0, -1);
    }
    return paragraph;
}

function isParagraphMilestone(element: ContentElement, allowEnd: boolean = false) {
    const types = ['start_milestone'];
    if (allowEnd) types.push('end_milestone');
    return (
        isContentModifier(element) &&
        types.includes(element.type) &&
        element.subtype === 'usfm:zusfm'
    );
}

function paragraphTypeByMilestone(content: Content): string | null {
    for (const element of content) {
        if (isContentModifier(element)) {
            if (isParagraphMilestone(element)) {
                return element.atts.class[0];
            }
            if (element.content) {
                const nestedType = paragraphTypeByMilestone(element.content);
                if (nestedType) return nestedType;
            }
        }
    }
    return null;
}

function removeParagraphMilestones(content: Content): Content {
    const filtered = content.filter((e) => !isParagraphMilestone(e, true));
    for (const element of filtered) {
        if (isContentModifier(element) && element.content) {
            element.content = removeParagraphMilestones(element.content);
        }
    }
    return filtered;
}

export function convertParagraphType(paragraph: Paragraph): Paragraph {
    const paragraphType = paragraphTypeByMilestone(paragraph.content);
    return {
        type: 'paragraph',
        subtype: `usfm:${paragraphType}`,
        content: removeParagraphMilestones(paragraph.content)
    };
}

function convertStorybookBlock(block: Block) {
    if (isParagraph(block)) {
        block.content = removeMarks(block.content);
        block = convertParagraphType(block as Paragraph);
        block = convertHeading(block as Paragraph);
        block = maybeConvertList(block as Paragraph);
        block = maybeConvertOrderedList(block as Paragraph);
    }
    return block;
}

export function convertStorybook(sofria: Document) {
    if (isNestedDocument(sofria)) {
        sofria.sequence.blocks = sofria.sequence.blocks.map(convertStorybookBlock);
        return sofria;
    }
    throw new Error(`Document structure not supported: ${sofria.schema.structure}`);
}
