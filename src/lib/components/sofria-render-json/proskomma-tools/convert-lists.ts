import {
    type Content,
    type Wrapper,
    type ContentModifier,
    type ContentElement,
    isWrapper,
    type Paragraph,
    type Block,
    type Graft,
    isParagraph
} from '../schema/sofria-schema';
import { replaceContent } from './convert-paragraph';

function listItemSubtype(level: number, ordered: boolean) {
    return ordered ? `zoli${level}` : `zuli${level}`;
}

function isListItemStart(element: ContentElement, level: number, ordered: boolean) {
    return (
        typeof element !== 'string' &&
        element.type === 'start_milestone' &&
        element.subtype === 'usfm:' + listItemSubtype(level, ordered)
    );
}

function isListItemEnd(element: ContentElement, level: number, ordered: boolean) {
    return (
        typeof element !== 'string' &&
        element.type === 'end_milestone' &&
        element.subtype === 'usfm:' + listItemSubtype(level, ordered)
    );
}

function isListItemMilestone(element: ContentElement, level: number, ordered: boolean) {
    return isListItemStart(element, level, ordered) || isListItemEnd(element, level, ordered);
}

function hasItemStart(element: ContentElement, level: number, ordered: boolean) {
    return (
        isListItemStart(element, level, ordered) ||
        (isWrapper(element) && element.content.find((e) => hasItemStart(e, level, ordered)))
    );
}

function hasList(content: Content, level: number, ordered: boolean) {
    // Look for milestones, which may be nested within wrapper elements
    const hasNestedList =
        content.filter(
            (element) =>
                typeof element !== 'string' &&
                element.type === 'wrapper' &&
                element.content &&
                hasList(element.content, level, ordered)
        ).length > 0;
    return (
        hasNestedList ||
        content.filter((element) => isListItemMilestone(element, level, ordered)).length > 0
    );
}

/**
 * Get content for each bullet item in an unordered list
 */
function listItems(content: Content, listLevel: number, ordered: boolean): Content[] {
    const items: Content[] = [];
    while (content.length > 0) {
        const { item, contentLeft } = nextListItem(content, listLevel, ordered, items.length === 0);
        items.push(item);
        content = contentLeft;
    }
    return items;
}

/**
 * Get content for the first bullet point in the given list
 *
 * @returns an object with the following properties:
 *  - item: The content for the list item
 *  - itemDone: Whether the item has terminated with an end milestone
 *  - contentLeft: Unparsed content containing the rest of the list items
 */
function nextListItem(content: Content, listLevel: number, ordered: boolean, isFirstItem: boolean) {
    const listContent: Content = [];
    for (let i = 0; i < content.length; i++) {
        const { element, itemDone, parseNext } = parseListElement(
            content[i],
            listLevel,
            ordered,
            isFirstItem
        );
        if (element) {
            listContent.push(element);
        }
        if (itemDone) {
            return {
                item: listContent,
                itemDone: true,
                contentLeft: getRemainingContent(content, i, parseNext)
            };
        }
    }
    return { item: listContent, itemDone: false, contentLeft: [] };
}

/**
 * Get content items after the given index, prepending parseNext if present
 */
function getRemainingContent(
    content: Content,
    lastParsedIndex: number,
    parseNext: null | ContentModifier
) {
    const i = lastParsedIndex + 1;
    return parseNext?.content.length > 0 ? [parseNext, ...content.slice(i)] : content.slice(i);
}

/**
 * Parse a content element of a list defined by milestones
 *
 * @returns an object with the following properties:
 *  - element: If not null, a content element to be appended to the parsed list
 *  - itemDone: Whether the given element marks the end of the current list item
 *  - parseNext: If itemDone is true, this element contains the next item to parse
 */
function parseListElement(
    element: ContentElement,
    listLevel: number,
    ordered: boolean,
    isFirstItem: boolean
) {
    if (isWrapper(element)) {
        const { item, itemDone, contentLeft } = nextListItem(
            element.content,
            listLevel,
            ordered,
            isFirstItem
        );
        return {
            element: replaceContent(element, item),
            itemDone,
            parseNext: replaceContent(element, contentLeft)
        };
    }
    return {
        element: isListItemMilestone(element, listLevel, ordered) ? null : element,
        itemDone:
            isListItemEnd(element, listLevel, ordered) ||
            (isFirstItem && isListItemStart(element, listLevel, ordered)),
        parseNext: null
    };
}

function orderedListStart(content: Content, level: number) {
    for (const element of content) {
        if (
            typeof element !== 'string' &&
            element.type === 'start_milestone' &&
            element.subtype === `usfm:zon${level}` &&
            element.atts?.start
        ) {
            return element.atts.start[0];
        } else if (isWrapper(element)) {
            const start = orderedListStart(element.content, level);
            if (start) {
                return start;
            }
        }
    }
    return '1';
}

/**
 * Remove \zon milestones from the given content
 *
 * @param content Content to be filtered
 * @param level The list level of the \zon elements
 * @param start Whether to remove start milestones instead of end milestones
 * @returns The content with \zon milestones removed
 */
function removeOrderedListMarkers(content: Content, level: number, start: boolean): Content {
    const milestonType = start ? 'start_milestone' : 'end_milestone';
    return content
        .filter(
            (element) =>
                typeof element === 'string' ||
                element.type !== milestonType ||
                element.subtype !== `usfm:zon${level}`
        )
        .map((element) =>
            isWrapper(element)
                ? replaceContent(element, removeOrderedListMarkers(element.content, level, start))
                : element
        );
}

function convertListLevel(content: Content, level: number, ordered: boolean) {
    content = removeOrderedListMarkers(content, level, false);
    const items = listItems(content, level, ordered);
    const label = items[0];
    const bullets = items
        .slice(1)
        .map((item) => convertNestedListContent(item, level + 1, ordered))
        // Clean up nested \zon start milestones
        .map((item) => removeOrderedListMarkers(item, level + 1, true))
        // Clean up empty list items
        .filter(hasTextContent)
        .map((item) => listBulletParagraph(item, level, ordered));
    const sequence = ordered
        ? {
              type: 'ordered_list',
              start: orderedListStart(items[0], level),
              blocks: bullets
          }
        : {
              type: 'list',
              blocks: bullets
          };
    const bulletsGraft: Graft = {
        type: 'graft',
        new: false,
        sequence
    };
    return { label, bullets: bulletsGraft };
}

function hasTextContent(content: Content): boolean {
    const text = content.find(
        (element) =>
            (typeof element === 'string' && element.trim().length) ||
            (isWrapper(element) && hasTextContent(element.content))
    );
    return text ? true : false;
}

function listBulletParagraph(itemContent: Content, level: number, ordered: boolean): Paragraph {
    return {
        type: 'paragraph',
        subtype: 'list_item',
        atts: {
            htmlClass: listItemSubtype(level, ordered)
        },
        content: itemContent
    };
}

function convertNestedListContent(content: Content, level: number, ordered: boolean): Content {
    const i = content.findIndex((element) => hasItemStart(element, level, ordered));
    if (i < 0) return content;
    const { label, bullets } = convertListLevel(content, level, ordered);
    return label.concat(bullets);
}

function convertList(paragraph: Paragraph, ordered: boolean): Paragraph {
    const { bullets } = convertListLevel(paragraph.content, 1, ordered);
    return {
        type: 'paragraph',
        subtype: 'list_container',
        content: [bullets]
    };
}

export function maybeConvertList(paragraph: Paragraph): Paragraph {
    if (hasList(paragraph.content, 1, false)) {
        return convertList(paragraph, false);
    }
    return paragraph;
}

export function maybeConvertOrderedList(paragraph: Paragraph): Paragraph {
    if (hasList(paragraph.content, 1, true)) {
        return convertList(paragraph, true);
    }
    return paragraph;
}
