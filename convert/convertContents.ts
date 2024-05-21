import { existsSync, readFileSync } from 'fs';
import jsdom from 'jsdom';
import path from 'path';
import { TaskOutput, Task } from './Task';

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
    imageFilename?: string;
    linkType?: string;
    linkTarget?: string;
    linkLocation?: string;
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

export function convertContents(dataDir: string, verbose: number) {
    const contentsFile = path.join(dataDir, 'contents.xml');
    if (!existsSync(contentsFile)) {
        return data;
    }
    const dom = new jsdom.JSDOM(readFileSync(contentsFile).toString(), {
        contentType: 'text/xml'
    });
    const { document } = dom.window;

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
                    title[lang] = titleTag.innerHTML;
                }
            }

            const subtitle: { [lang: string]: string } = {};
            const subtitleTags = itemTag.getElementsByTagName('subtitle');
            if (subtitleTags?.length > 0) {
                for (const subtitleTag of subtitleTags) {
                    const lang = subtitleTag.attributes.getNamedItem('lang')!.value;
                    subtitle[lang] = subtitleTag.innerHTML;
                }
            }

            const imageFilename = itemTag.getElementsByTagName('image-filename')[0]?.innerHTML;

            const linkTags = itemTag.getElementsByTagName('link');
            const linkType = linkTags[0]?.attributes.getNamedItem('type')!.value;
            const linkTarget = linkTags[0]?.attributes.getNamedItem('target')?.value ?? '';
            const linkLocation = linkTags[0]?.attributes.getNamedItem('location')?.value ?? '';

            const features: any = {};

            const featureTags = itemTag.getElementsByTagName('feature');
            for (const featureTag of featureTags) {
                const value = featureTag.attributes.getNamedItem('value')!.value;
                const name = featureTag.attributes.getNamedItem('name')!.value;
                features[name] = parseFeatureValue(value);
            }

            data.items.push({
                id,
                heading,
                title,
                subtitle,
                imageFilename,
                linkType,
                linkTarget,
                linkLocation,
                features
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
    public triggerFiles: string[] = ['contents.xml'];

    constructor(dataDir: string) {
        super(dataDir);
    }
    public run(verbose: number): ContentsTaskOutput {
        const data = convertContents(this.dataDir, verbose);
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
