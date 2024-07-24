import { cpSync, existsSync, readFileSync, rmSync } from 'fs';
import jsdom from 'jsdom';
import path from 'path';
import { TaskOutput, Task } from './Task';
import { ConfigTaskOutput } from './convertConfig';

type ContentItem = {
    id: number;
    heading?: boolean;
    features?: any;
    title: {
        [lang: string]: string;
    };
    subtitle?: {
        [lang: string]: string;
    };
    audioFilename?: {
        [lang: string]: string;
    };
    imageFilename?: string;
    linkType?: string;
    linkTarget?: string;
    linkLocation?: string;
    layoutMode?: string;
    layoutCollection?: string[];
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

function decodeFromXml(input: string): string {
    return input
        .replace('&quot;', '"')
        .replace('&apos;', "'")
        .replace('&lt;', '<')
        .replace('&gt;', '>')
        .replace('&amp;', '&');
}

export function convertContents(dataDir: string, configData: ConfigTaskOutput, verbose: number) {
    const contentsDir = path.join(dataDir, 'contents');
    const destDir = path.join('static', 'contents');
    if (existsSync(contentsDir)) {
        cpSync(contentsDir, destDir, { recursive: true });
    } else {
        if (existsSync(destDir)) {
            rmSync(destDir, { recursive: true });
        }
    }

    const contentsFile = path.join(dataDir, 'contents.xml');
    if (!existsSync(contentsFile)) {
        return data;
    }
    const dom = new jsdom.JSDOM(readFileSync(contentsFile).toString(), {
        contentType: 'text/xml'
    });
    const { document } = dom.window;

    // title
    const contents = document.children[0];
    const titleTags = Array.from(contents.children).filter(
        (element) => element.tagName.toLowerCase() === 'title'
    );
    if (titleTags?.length > 0) {
        data.title = {};
        for (const titleTag of titleTags) {
            const lang = titleTag.attributes.getNamedItem('lang')!.value;
            data.title[lang] = decodeFromXml(titleTag.innerHTML);
        }
    }

    // Features
    data.features = {};
    const featuresTag = document.getElementsByTagName('features')[0];
    const featureTags = featuresTag.getElementsByTagName('feature');
    for (const featureTag of featureTags) {
        const value = featureTag.attributes.getNamedItem('value')!.value;
        const name = featureTag.attributes.getNamedItem('name')!.value;
        data.features[name] = parseFeatureValue(value);
    }

    // Items
    const itemsTag = document.getElementsByTagName('contents-items')[0];
    const itemTags = itemsTag.getElementsByTagName('contents-item');
    if (itemTags?.length > 0) {
        data.items = [];
        for (const itemTag of itemTags) {
            const id = Number(itemTag.attributes.getNamedItem('id')!.value);
            const heading = itemTag.attributes.getNamedItem('heading')?.value
                ? Boolean(itemTag.attributes.getNamedItem('heading')?.value)
                : undefined;
            const title: { [lang: string]: string } = {};
            const titleTags = itemTag.getElementsByTagName('title');
            if (titleTags?.length > 0) {
                for (const titleTag of titleTags) {
                    const lang = titleTag.attributes.getNamedItem('lang')!.value;
                    title[lang] = decodeFromXml(titleTag.innerHTML);
                }
            }

            const subtitle: { [lang: string]: string } = {};
            const subtitleTags = itemTag.getElementsByTagName('subtitle');
            if (subtitleTags?.length > 0) {
                for (const subtitleTag of subtitleTags) {
                    const lang = subtitleTag.attributes.getNamedItem('lang')!.value;
                    subtitle[lang] = decodeFromXml(subtitleTag.innerHTML);
                }
            }

            const audioFilename: { [lang: string]: string } = {};
            const audioTags = itemTag.getElementsByTagName('audio');
            if (audioTags?.length > 0) {
                for (const audioTag of audioTags) {
                    const lang = audioTag.attributes.getNamedItem('lang')!.value;
                    audioFilename[lang] = decodeFromXml(audioTag.innerHTML);
                }
            }
            const imageFilename = itemTag.getElementsByTagName('image-filename')[0]?.innerHTML;

            const linkTags = itemTag.getElementsByTagName('link');
            let linkType = linkTags[0]?.attributes.getNamedItem('type')?.value;
            const linkTarget = linkTags[0]?.attributes.getNamedItem('target')?.value;
            let linkLocation = linkTags[0]?.attributes.getNamedItem('location')?.value;

            const features: any = {};

            const featureTags = itemTag.getElementsByTagName('feature');
            for (const featureTag of featureTags) {
                const value = featureTag.attributes.getNamedItem('value')!.value;
                const name = featureTag.attributes.getNamedItem('name')!.value;
                features[name] = parseFeatureValue(value);
            }

            const layoutTags = itemTag.getElementsByTagName('layout');
            const layoutMode = layoutTags[0]?.attributes.getNamedItem('mode')?.value;

            let layoutCollection = undefined;
            const layoutCollectionTags = itemTag.getElementsByTagName('layout-collection');
            if (layoutCollectionTags?.length > 0) {
                layoutCollection = [];
                for (const layoutCollectionTag of layoutCollectionTags) {
                    const id = layoutCollectionTag.attributes.getNamedItem('id')!.value;
                    layoutCollection.push(id);
                }
            }

            if (linkType === 'reference') {
                // In the native app, app of the books are handled by the BookFragment.
                // In the PWA, we have different routes for different book types since
                // Proskomma can only handle USFM and the other book types include non-
                // standard SFM tags.

                configData.data.bookCollections?.some((collection) => {
                    if (verbose) console.log(`Searching for ${linkTarget} in ${collection.id}`);
                    const book = collection.books.find((x) => x.id === linkTarget);
                    if (book && book.type) {
                        // We found a book and the book.type is not default (i.e. undefined)
                        if (verbose)
                            console.log(`Found ${linkTarget} in ${collection.id} as ${book.type}`);
                        linkType = book.type;
                        linkLocation = `${linkType}/${collection.id}/${linkTarget}`;
                        return true;
                    }
                });
            }

            data.items.push({
                id,
                heading,
                title,
                subtitle,
                audioFilename,
                imageFilename,
                linkType,
                linkLocation,
                linkTarget,
                features,
                layoutMode,
                layoutCollection
            });
        }
    }

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
                    const lang = titleTag.attributes.getNamedItem('lang')!.value;
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

        const data = convertContents(this.dataDir, config, verbose);
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
