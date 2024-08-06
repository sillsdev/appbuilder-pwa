import {
    ContentElement,
    isContentModifier,
    type Content,
    type Paragraph
} from '../schema/sofria-schema';

export function removeMarks(content: Content) {
    return content.filter((element) => typeof element == 'string' || element.type !== 'mark');
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

export function convertProskommaDocument(document: Document) {
    return Document;
}
