import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { ScriptureConfig } from '$config';
import jsdom from 'jsdom';
import { ConfigTaskOutput, parseLangAttribute } from './convertConfig';
import { createHashedFile, createOutputDir, deleteOutputDir, joinUrlPath } from './fileUtils';
import { Task, TaskOutput } from './Task';

type LangContainer = { [lang: string]: string };

type LinkMeta = {
    // intended to pass between functions so that there is one object passed
    linkType?: string;
    linkTarget?: string;
    linkLocation?: string;
};

type ContentItem = {
    id: number;
    heading?: boolean;
    features?: any;
    title: LangContainer;
    subtitle?: LangContainer;
    audioFilename?: LangContainer;
    imageFilename?: string;
    itemType?: string;
    contentItemContainer: boolean;
    linkType?: string;
    linkTarget?: string;
    linkLocation?: string;
    layoutMode?: string;
    layoutCollection?: string[];
    children?: ContentItem[];
};

type ContentScreen = {
    id: number;
    title?: {
        [lang: string]: string;
    };
    items?: {
        id: number;
    }[];
};

export type ContentsData = {
    title?: {
        [lang: string]: string;
    };
    features?: any;
    items?: ContentItem[];
    nestedItems?: boolean;
    screens?: ContentScreen[];
};

const data: ContentsData = {};

export interface ContentsTaskOutput extends TaskOutput {
    taskName: 'ConvertContents';
}

function parseFeatureValue(value: any): any {
    if (!value.includes(':') && !value.includes('%') && !isNaN(parseInt(value))) {
        value = parseInt(value);
    } else if (['true', 'false'].includes(value)) {
        value = value === 'true' ? true : false;
    }
    // else {} // " " split array, string, enum or time
    return value;
}

// Nested items detection
function isTagInnerNestedItem(tag: Element | HTMLElement | undefined): boolean {
    if (tag === undefined) return false;
    if (tag.parentElement?.tagName === 'contents') return false; // for /contents/contents-items
    if (
        // for /contents/contents-items/content-item/contents-items/title
        tag.parentElement?.parentElement?.parentElement?.tagName === 'contents-item' &&
        tag.parentElement?.parentElement?.parentElement?.hasAttribute('type')
    )
        return true;

    return (
        // for upper level contents-item
        // more of the default expectation
        tag.parentElement?.parentElement?.tagName === 'contents-item' &&
        tag.parentElement?.parentElement?.hasAttribute('type')
    );
}

function tagHasInnerNestedItems(tag: Element | HTMLElement | undefined): boolean {
    if (tag === undefined) return false;

    if (tag.children.length > 0) {
        for (const child of tag.children) {
            if (child.tagName === 'contents-items') {
                return true;
            }
        }
    }
    return false;
}

function decodeFromXml(input: string): string {
    return input
        .replace('&quot;', '"')
        .replace('&apos;', "'")
        .replace('&lt;', '<')
        .replace('&gt;', '>')
        .replace('&amp;', '&');
}

// Item Parsing functions
function parseItemId(tag: Element | HTMLElement | undefined): number {
    if (tag === undefined) {
        console.warn('parseItemId got an undefined tag');
        return 0;
    }
    return Number(tag.attributes.getNamedItem('id')!.value);
}

function parseItemType(
    tag: Element | HTMLElement | undefined,
    contentItemContainer: boolean,
    prevItemType: string | undefined = undefined
): string | undefined {
    if (tag === undefined) return undefined;
    let itemType: string | undefined = undefined;

    if (tag.hasAttribute('type')) {
        itemType = String(tag.attributes.getNamedItem('type')!.value);
    } else {
        itemType = 'single'; // the only item type that is not specified in contents.xml
    }

    return itemType;
}

function parseItemHeading(tag: Element | HTMLElement | undefined): boolean {
    if (tag === undefined) return false;

    const headingAttr = tag.attributes.getNamedItem('heading')?.value;
    const heading = headingAttr !== undefined ? headingAttr.toLocaleLowerCase() === 'true' : false;
    return heading;
}

function parseItemTitle(
    tag: Element | HTMLElement | undefined,
    upperLayer: boolean,
    verbose: number
): LangContainer {
    let title: LangContainer = {};
    if (tag === undefined) return title; // empty title
    const titleTags = tag.getElementsByTagName('title');
    if (titleTags?.length > 0) {
        for (const titleTag of titleTags) {
            if (verbose >= 3) {
                console.log(
                    `title is nested: ${isTagInnerNestedItem(titleTag)} ${titleTag.innerHTML} ${titleTag.parentElement?.parentElement?.tagName}`
                );
            }
            if ((!isTagInnerNestedItem(titleTag) && upperLayer) || !upperLayer) {
                // This logic is necessary because getElementsByTagName flattens the xml with both current and child nodes. Thus an upper layer node would get
                // the last child item's title
                const lang = parseLangAttribute(titleTag);
                title[lang] = decodeFromXml(titleTag.innerHTML);
            }
        }
    }
    return title;
}

function parseItemSubtitle(tag: Element | HTMLElement | undefined): LangContainer {
    let subtitle: LangContainer = {};
    if (tag === undefined) return subtitle;

    const subtitleTags = tag.getElementsByTagName('subtitle');
    if (subtitleTags?.length > 0) {
        for (const subtitleTag of subtitleTags) {
            const lang = parseLangAttribute(subtitleTag);
            subtitle[lang] = decodeFromXml(subtitleTag.innerHTML);
        }
    }
    return subtitle;
}

function parseItemImage(
    tag: Element | HTMLElement | undefined,
    contentsDir: string,
    verbose: number,
    hasContentsDir: boolean
): string | undefined {
    if (tag === undefined) return undefined;
    let imageFilename = '';

    imageFilename = tag.getElementsByTagName('image-filename')[0]?.innerHTML;
    if (hasContentsDir && imageFilename) {
        if (existsSync(path.join(contentsDir, imageFilename))) {
            imageFilename = createHashedFile(
                contentsDir,
                imageFilename,
                verbose,
                'contents'
            ).replace(/contents\//, '');
        } else {
            console.warn(`Could not locate ${imageFilename}`);
        }
    }

    return imageFilename;
}

function parseItemAudio(
    tag: Element | HTMLElement | undefined,
    contentsDir: string,
    destDir: string,
    verbose: number,
    hasContentsDir: boolean
): LangContainer {
    const audioFilename: LangContainer = {};
    if (tag === undefined) return audioFilename;

    const audioTags = tag.getElementsByTagName('audio');
    if (audioTags?.length > 0) {
        for (const audioTag of audioTags) {
            const lang = parseLangAttribute(audioTag);
            audioFilename[lang] = decodeFromXml(audioTag.innerHTML);
            if (hasContentsDir) {
                if (existsSync(path.join(contentsDir, audioFilename[lang]))) {
                    audioFilename[lang] = createHashedFile(
                        contentsDir,
                        audioFilename[lang],
                        verbose,
                        'contents'
                    ).replace(/contents\//, '');
                } else {
                    console.warn(`Could not locate ${audioFilename[lang]}`);
                }
            }
        }
    }
    return audioFilename;
}

function parseItemLink(
    tag: Element | HTMLElement | undefined,
    scriptureConfig: ScriptureConfig,
    verbose: number
): LinkMeta {
    let link: LinkMeta = {};
    if (tag === undefined) return link;

    const linkTags = tag.getElementsByTagName('link');
    link.linkType = linkTags[0]?.attributes.getNamedItem('type')?.value;
    link.linkTarget = linkTags[0]?.attributes.getNamedItem('target')?.value;
    link.linkLocation = linkTags[0]?.attributes.getNamedItem('location')?.value;

    if (link.linkType === 'reference') {
        // In the native app, app of the books are handled by the BookFragment.
        // In the PWA, we have different routes for different book types since
        // Proskomma can only handle USFM and the other book types include non-
        // standard SFM tags.

        scriptureConfig.bookCollections?.some((collection) => {
            if (verbose) console.log(`Searching for ${link.linkTarget} in ${collection.id}`);
            const book = collection.books.find((x) => x.id === link.linkTarget);
            if (book && book.type) {
                // We found a book and the book.type is not default (i.e. undefined)
                if (verbose)
                    console.log(`Found ${link.linkTarget} in ${collection.id} as ${book.type}`);
                link.linkType = book.type;
                link.linkLocation = `${link.linkType}/${collection.id}/${link.linkTarget}`;
                return true;
            }
            return false;
        });
    }

    return link;
}

function parseItemFeatures(tag: Element | HTMLElement | undefined): any {
    const features: any = {};
    if (tag === undefined) return features;

    const featureTags = tag.getElementsByTagName('feature');
    for (const featureTag of featureTags) {
        const value = featureTag.attributes.getNamedItem('value')!.value;
        const name = featureTag.attributes.getNamedItem('name')!.value;
        features[name] = parseFeatureValue(value);
    }
    return features;
}

function parseItemLayoutMode(tag: Element | HTMLElement | undefined): string | undefined {
    if (tag === undefined) return undefined;
    const layoutTags = tag.getElementsByTagName('layout');
    return layoutTags[0]?.attributes.getNamedItem('mode')?.value;
}

function parseItemLayoutCollection(
    tag: Element | HTMLElement | undefined
): Array<string> | undefined {
    let layoutCollection = undefined;
    if (tag === undefined) return layoutCollection;
    const layoutCollectionTags = tag.getElementsByTagName('layout-collection');
    if (layoutCollectionTags?.length > 0) {
        layoutCollection = [];
        for (const layoutCollectionTag of layoutCollectionTags) {
            const id = layoutCollectionTag.attributes.getNamedItem('id')!.value;
            layoutCollection.push(id);
        }
    }
    return layoutCollection;
}

export function convertContents(
    dataDir: string,
    scriptureConfig: ScriptureConfig,
    verbose: number
) {
    const contentsDir = path.join(dataDir, 'contents');
    const destDir = path.join('static', 'contents');
    const hasContentsDir = existsSync(contentsDir);
    if (hasContentsDir) {
        createOutputDir(destDir);
    } else {
        deleteOutputDir(destDir);
    }

    const contentsFile = path.join(dataDir, 'contents.xml');
    if (!existsSync(contentsFile)) {
        return data;
    }
    const dom = new jsdom.JSDOM(readFileSync(contentsFile).toString(), {
        contentType: 'text/xml'
    });
    const { document } = dom.window;

    // Contents Menu title
    const contents = document.children[0];
    const titleTags = Array.from(contents.children).filter(
        (element) => element.tagName.toLowerCase() === 'title'
    );
    if (titleTags?.length > 0) {
        data.title = {};
        for (const titleTag of titleTags) {
            const lang = parseLangAttribute(titleTag);
            data.title[lang] = decodeFromXml(titleTag.innerHTML);
        }
    }

    // Contents Menu Features
    data.features = {};
    const featuresTag = document.getElementsByTagName('features')[0];
    const featureTags = featuresTag.getElementsByTagName('feature');
    for (const featureTag of featureTags) {
        const value = featureTag.attributes.getNamedItem('value')!.value;
        const name = featureTag.attributes.getNamedItem('name')!.value;
        data.features[name] = parseFeatureValue(value);
    }

    let nestedItems = false; // Do any of the items have a nested items?

    // Items
    const itemsTag = document.getElementsByTagName('contents-items')[0];
    const itemTags = itemsTag.getElementsByTagName('contents-item');

    if (itemTags?.length > 0) {
        data.items = [];
        let prevItemType: string | undefined = undefined;
        let currentContentContainer: number | undefined = undefined;
        let hasNestedItems = false; // Does this specific item have nested items?

        for (const itemTag of itemTags) {
            const isNestedItem = isTagInnerNestedItem(itemTag);
            hasNestedItems = tagHasInnerNestedItems(itemTag);

            if (verbose >= 3)
                console.log(
                    `tagName: ${itemTag.tagName} itemType: ${itemTag.getAttribute('type') ?? ''} isNestedItem: ${isNestedItem} hasNestedItems: ${hasNestedItems}`
                );

            if (isNestedItem) {
                continue; // skip nesteditems in the main loop, we will get them below for the parent item
            }

            let contentItemContainer = itemTag.hasAttribute('type');
            const itemType = parseItemType(itemTag, contentItemContainer);

            if (verbose >= 3) console.log(`itemTypes: prev: ${prevItemType} now: ${itemType} `);

            const id = parseItemId(itemTag);

            const heading = parseItemHeading(itemTag);

            const title = parseItemTitle(itemTag, true, verbose);

            if (verbose >= 3 && itemType === undefined)
                console.warn(`item type is undefined for ${title}`);

            const subtitle = parseItemSubtitle(itemTag);

            let audioFilename: { [lang: string]: string } = {};
            let imageFilename: string | undefined = undefined;
            if (!hasNestedItems) {
                audioFilename = parseItemAudio(
                    itemTag,
                    contentsDir,
                    destDir,
                    verbose,
                    hasContentsDir
                );
                imageFilename = parseItemImage(itemTag, contentsDir, verbose, hasContentsDir);
            }

            const link: LinkMeta = parseItemLink(itemTag, scriptureConfig, verbose);

            const features: any = parseItemFeatures(itemTag);

            const layoutMode = parseItemLayoutMode(itemTag); //= layoutTags[0]?.attributes.getNamedItem('mode')?.value;

            const layoutCollection = parseItemLayoutCollection(itemTag);

            // Children items
            const children: ContentItem[] = [];

            if (hasNestedItems) {
                if (itemTag.children.length > 0) {
                    nestedItems = true;
                    let itemChildren = itemTag.querySelectorAll('contents-item');
                    for (const itemChild of itemChildren) {
                        const cId = parseItemId(itemChild);
                        const cTitle = parseItemTitle(itemChild, false, verbose);
                        let childContentItemContainer = false; // by virtue of being a child item it is not a contentItemContainer
                        const cItemType = itemType; // Technically this is a child of the item
                        const cSubtitle = parseItemSubtitle(itemChild);
                        if (verbose >= 3) console.log(`Child Tag: ${itemChild.tagName}`);
                        const cImageFileName = parseItemImage(
                            itemChild,
                            contentsDir,
                            verbose,
                            hasContentsDir
                        );
                        const cAudioFilename = parseItemAudio(
                            itemChild,
                            contentsDir,
                            destDir,
                            verbose,
                            hasContentsDir
                        );
                        const cLink: LinkMeta = parseItemLink(itemChild, scriptureConfig, verbose);
                        const cFeatures: any = parseItemFeatures(itemChild);
                        const cLayoutMode = parseItemLayoutMode(itemChild);
                        const cLayoutCollection = parseItemLayoutCollection(itemChild);

                        children.push({
                            id: cId,
                            title: cTitle,
                            subtitle: cSubtitle,
                            contentItemContainer: childContentItemContainer,
                            itemType: cItemType,
                            imageFilename: cImageFileName,
                            audioFilename: cAudioFilename,
                            linkLocation: cLink.linkLocation,
                            linkType: cLink.linkType,
                            linkTarget: cLink.linkTarget,
                            features: cFeatures,
                            layoutMode: cLayoutMode,
                            layoutCollection: cLayoutCollection
                        });
                    }
                }
            }

            data.items.push({
                id,
                heading,
                title,
                subtitle,
                audioFilename,
                imageFilename,
                itemType,
                contentItemContainer,
                linkType: link.linkType,
                linkLocation: link.linkLocation,
                linkTarget: link.linkTarget,
                features,
                layoutMode,
                layoutCollection,
                children
            });

            if (itemType !== prevItemType) prevItemType = itemType; // pass on itemType the next iteration
        }
    }

    data.nestedItems = nestedItems;

    // Screens
    const screensTag = document.getElementsByTagName('contents-screens')[0];
    const screenTags = screensTag.getElementsByTagName('contents-screen');
    if (screenTags?.length) {
        data.screens = [];
        for (const screenTag of screenTags) {
            const id = Number(screenTag.attributes.getNamedItem('id')!.value);
            const title: { [lang: string]: string } = {};
            const titleTags = screenTag.getElementsByTagName('title');
            if (titleTags?.length > 0) {
                for (const titleTag of titleTags) {
                    const lang = parseLangAttribute(titleTag);
                    title[lang] = titleTag.innerHTML;
                }
            }

            const itemsTag = screenTag.getElementsByTagName('items')[0];
            const itemTags = itemsTag.getElementsByTagName('item');
            const items = [];
            if (itemTags?.length > 0) {
                for (const itemTag of itemTags) {
                    const id = Number(itemTag.attributes.getNamedItem('id')!.value);
                    items.push({
                        id
                    });
                }
            }
            data.screens.push({
                id,
                title,
                items
            });
        }
    }

    return data;
}

export interface ContentsTaskOutput extends TaskOutput {
    data: ContentsData;
}

export class ConvertContents extends Task {
    public triggerFiles: string[] = ['contents.xml', 'appdef.xml', 'contents'];

    constructor(dataDir: string) {
        super(dataDir);
    }
    public run(verbose: number, outputs: Map<string, TaskOutput>): ContentsTaskOutput {
        const config = outputs.get('ConvertConfig') as ConfigTaskOutput;
        const scriptureConfig = config.data as ScriptureConfig;

        const data = convertContents(this.dataDir, scriptureConfig, verbose);
        return {
            taskName: 'ConvertContents',
            data,
            files: [
                {
                    path: 'src/lib/data/contents.js',
                    content: `export default ${JSON.stringify(data, null, 2)}`
                }
            ]
        };
    }
}
