import { Console } from 'console';
import { readFileSync } from 'fs';
import jsdom from 'jsdom';
import path from 'path';
import { Task, TaskOutput } from './Task';

/**
 * TODO:
 * Backgroud images?
 * Layouts?
 * Styles?
 */
type HTML = string;

type BookCollectionAudio = {
    num: number;
    src: string;
    len?: number;
    size?: number;
    filename: string;
    timingFile: string;
};

type BookCollection = {
    id: string;
    features: any;
    books: {
        id: string;
        name: string;
        abbreviation: string;
        testament: string;
        section: string; // Pentateuch
        chapters: number;
        chaptersN: string; // 1-34
        file: string;
        audio: BookCollectionAudio[];
        styles?: {
            name: string;
            category?: string;
            properties: {
                [key: string]: string;
            };
        }[];
    }[];
    style?: {
        font: string;
        textSize: number;
        lineHeight: number;
        textDirection: string;
        numeralSystem: string;
        verseNumbers: string;
    };
    languageCode: string;
    languageName?: string;
    footer?: HTML; //
    meta?: {
        [key: string]: string;
    };
    styles?: {
        name: string;
        category?: string;
        properties: {
            [key: string]: string;
        };
    }[];
    collectionName?: string;
    collectionAbbreviation?: string;
    collectionDescription?: string;
};

export type ConfigData = {
    name?: string;
    mainFeatures?: any;
    fonts?: {
        name?: string;
        family: string;
        file: string;
        fontWeight: string;
        fontStyle: string;
    }[];
    themes?: {
        name: string;
        enabled: boolean;
        colorSets: {
            type: string;
            colors: {
                [key: string]: string;
            };
        }[];
    }[];
    styles?: {
        name: string;
        category?: string;
        properties: {
            [key: string]: string;
        };
    }[];
    defaultTheme?: string;
    traits?: any;
    bookCollections?: BookCollection[];
    translationMappings?: {
        [key: string]: {
            [lang: string]: string;
        };
    };
    keys?: string[];
    about?: string; // TODO
    analytics?: {
        // TODO
        id: string;
        name: string;
        type: string;
    }[];
    audio?: {
        sources: {
            [key: string]: {
                type: string;
                name: string;
                accessMethods?: string[];
                folder?: string;
                key?: string;
                damId?: string;
                address?: string;
            };
        };
    };
    videos?: {
        // TODO
        id: string;
        width: number;
        height: number;
        title: string;
        thumbnail: string;
        onlineUrl: string;
        placement: {
            pos: string;
            ref: string;
            collection: number;
        };
    };
    layouts?: {
        // TODO
        mode: string;
        enabled: boolean;
        features?: {
            [key: string]: any;
        };
    }[];
    menuItems?: {
        type: string;
        title: {
            [lang: string]: string;
        };
        link?: {
            [lang: string]: string;
        };
        linkId?: {
            [lang: string]: string;
        };
        images?: {
            width: number;
            height: number;
            file: string;
        }[];
    }[];
    defaultLayout?: string; // TODO
    security?: {
        // TODO
        features?: {
            [key: string]: any;
        };
        pin: string;
        mode: string;
    };
};

const data: ConfigData = {};

function parseConfigValue(value: any) {
    if (!value.includes(':') && !isNaN(parseInt(value))) value = parseInt(value);
    else if (['true', 'false'].includes(value)) value = value === 'true' ? true : false;
    // else {} // " " split array, string, enum or time
    return value;
}

function parseStyles(stylesTag: Element) {
    const styles = [];
    const styleTags = stylesTag?.getElementsByTagName('style');
    if (!styleTags) throw new Error('Styles tag not found in xml');
    for (const tag of styleTags) {
        //console.log(tag.outerHTML);
        const name = tag.attributes.getNamedItem('name')!.value;
        const category = tag.attributes.getNamedItem('category')?.value;
        const properties: { [key: string]: string } = {};
        const propertyTags = tag.getElementsByTagName('sd');
        for (const propertyTag of propertyTags) {
            const propName = propertyTag.getAttribute('property');
            const propValue = propertyTag.getAttribute('value');
            if (propName && propValue) properties[propName] = propValue;
        }
        styles.push({
            name,
            category,
            properties
        });
    }

    return styles;
}

function convertConfig(dataDir: string, verbose: number) {
    const dom = new jsdom.JSDOM(readFileSync(path.join(dataDir, 'appdef.xml')).toString(), {
        contentType: 'text/xml'
    });
    const { document } = dom.window;

    // Name
    data.name = document.getElementsByTagName('app-name')[0].innerHTML;
    if (verbose) console.log(`Converting ${data.name}...`);

    // Features
    const mainFeatureTags = document
        .querySelector('features[type=main]')
        ?.getElementsByTagName('e');
    if (!mainFeatureTags) throw new Error('Features tag not found in xml');
    data.mainFeatures = {};

    for (const tag of mainFeatureTags) {
        try {
            const value: any = tag.attributes.getNamedItem('value')!.value;
            data.mainFeatures[tag.attributes.getNamedItem('name')!.value] = parseConfigValue(value);
        } catch (e) {
            if (e instanceof ReferenceError) {
                console.error(
                    'The main features section did not have the expected attributes `name` and `value`'
                );
            } else throw e;
        }
    }
    if (verbose) console.log(`Converted ${Object.keys(data.mainFeatures).length} features`);

    // Fonts
    const fontTags = document.getElementsByTagName('fonts')[0].getElementsByTagName('font');
    data.fonts = [];

    for (const tag of fontTags) {
        data.fonts.push({
            family: tag.attributes.getNamedItem('family')!.value,
            name: tag.getElementsByTagName('font-name')[0]?.innerHTML,
            file: tag.getElementsByTagName('f')[0].innerHTML,
            fontStyle: tag
                .querySelector('sd[property=font-style]')!
                .attributes.getNamedItem('value')!.value,
            fontWeight: tag
                .querySelector('sd[property=font-weight]')!
                .attributes.getNamedItem('value')!.value
        });
    }
    if (verbose) console.log(`Converted ${data.fonts.length} fonts`);

    // Color themes
    const colorThemeTags = document
        .getElementsByTagName('color-themes')[0]
        .getElementsByTagName('color-theme');
    const colorSetTags = document.getElementsByTagName('colors');
    data.themes = [];

    for (const tag of colorThemeTags) {
        const theme = tag.attributes.getNamedItem('name')!.value;
        data.themes.push({
            name: theme,
            enabled: tag.attributes.getNamedItem('enabled')?.value === 'true',
            colorSets: Array.from(colorSetTags).map((cst) => {
                const colorTags = cst.getElementsByTagName('color');
                const colors: { [key: string]: string } = {};
                for (const color of colorTags) {
                    const cm = color.querySelector(`cm[theme="${theme}"]`);
                    const name = color.getAttribute('name');
                    const value = cm?.getAttribute('value');
                    if (name && value) colors[name] = value;
                }
                return {
                    type: cst.getAttribute('type')!,
                    colors: colors
                };
            })
        });
        if (tag.attributes.getNamedItem('default')?.value === 'true')
            data.defaultTheme = data.themes[data.themes.length - 1].name;
    }
    if (verbose) console.log(`Converted ${data.themes.length} themes`);

    // Styles
    const mainStyles = document.querySelector('styles')!;
    data.styles = parseStyles(mainStyles);

    // Traits
    const traitTags = document.getElementsByTagName('traits')[0].getElementsByTagName('trait');
    data.traits = {};

    for (const tag of traitTags) {
        data.traits[tag.attributes.getNamedItem('name')!.value] =
            tag.attributes.getNamedItem('value')?.value;
    }
    if (verbose) console.log(`Converted ${Object.keys(data.traits).length} traits`);

    // Book collections
    const booksTags = document.getElementsByTagName('books');
    data.bookCollections = [];

    for (const tag of booksTags) {
        if (verbose >= 2) console.log(`Converting Collection: ${tag.id}`);
        const featuresTags = tag.querySelector('features[type=bc]')?.getElementsByTagName('e');
        if (!featuresTags) throw 'Book collection feature tags missing';
        const features: any = {};
        if (verbose >= 2) console.log(`. features`);
        for (const feature of featuresTags) {
            features[feature.attributes.getNamedItem('name')!.value] = parseConfigValue(
                feature.attributes.getNamedItem('value')!.value
            );
        }
        const books: BookCollection['books'] = [];
        const bookTags = tag.getElementsByTagName('book');
        for (const book of bookTags) {
            if (verbose >= 2) console.log(`. book: ${book.id}`);
            const audio: BookCollectionAudio[] = [];
            for (const page of book.getElementsByTagName('page')) {
                if (verbose >= 2) console.log(`.. page: ${page.attributes[0].value}`);
                const audioTag = page.getElementsByTagName('audio')[0];
                if (!audioTag) continue;
                const fTag = audioTag.getElementsByTagName('f')[0];
                if (verbose >= 2)
                    console.log(`... audioTag: ${audioTag.outerHTML}, fTag:${fTag.outerHTML}`);
                audio.push({
                    num: parseInt(page.attributes.getNamedItem('num')!.value),
                    filename: fTag.innerHTML,
                    len: fTag.hasAttribute('len')
                        ? parseInt(fTag.attributes.getNamedItem('len')!.value)
                        : undefined,
                    size: fTag.hasAttribute('size')
                        ? parseInt(fTag.attributes.getNamedItem('size')!.value)
                        : undefined,
                    src: fTag.attributes.getNamedItem('src')!.value,
                    timingFile: audioTag.getElementsByTagName('y')[0]?.innerHTML
                });
                if (verbose >= 3) console.log(`.... audio: `, JSON.stringify(audio[0]));
            }
            const bkStyles = book.querySelector('styles');
            const styles = bkStyles ? parseStyles(bkStyles) : undefined;

            books.push({
                chapters: parseInt(
                    book.getElementsByTagName('ct')[0].attributes.getNamedItem('c')!.value
                ),
                chaptersN: book.getElementsByTagName('cn')[0].attributes.getNamedItem('value')!
                    .value,
                id: book.attributes.getNamedItem('id')!.value,
                name: book.getElementsByTagName('n')[0]?.innerHTML,
                section: book.getElementsByTagName('sg')[0]?.innerHTML,
                testament: book.getElementsByTagName('g')[0]?.innerHTML,
                abbreviation: book.getElementsByTagName('v')[0]?.innerHTML,
                audio,
                file: book.getElementsByTagName('f')[0]?.innerHTML.replace(/\.\w*$/, '.usfm'),
                styles
            });
            if (verbose >= 3) console.log(`.... book: `, JSON.stringify(books[0]));
        }
        const collectionNameTags = tag.getElementsByTagName('book-collection-name');
        const collectionName = collectionNameTags[0].innerHTML.length
            ? collectionNameTags[0].innerHTML
            : undefined;
        if (verbose >= 2) console.log(`.. collectionName: `, collectionName);
        const stylesTag = tag.getElementsByTagName('styles-info')[0];
        if (verbose >= 3) console.log(`.... styles: `, JSON.stringify(stylesTag));
        const writingSystem = tag.getElementsByTagName('writing-system')[0];
        if (verbose >= 3) console.log(`.... writingSystem: `, JSON.stringify(writingSystem));
        if (!writingSystem) {
            throw `BookCollection "${collectionName}" missing writing-system`;
        }
        const languageCode = writingSystem.attributes.getNamedItem('code')!.value;
        if (!languageCode) {
            throw `BookCollection "${collectionName}" missing required language information: languageCode="${languageCode}"`;
        }
        const languageName = writingSystem
            .getElementsByTagName('display-names')[0]
            ?.getElementsByTagName('form')[0].innerHTML;
        const collectionDescriptionTags = tag.getElementsByTagName('book-collection-description');
        const collectionDescription = collectionDescriptionTags[0]?.innerHTML.length
            ? collectionDescriptionTags[0].innerHTML
            : undefined;
        if (verbose >= 2) console.log(`.. collectionDescription: `, collectionDescription);
        const collectionAbbreviationTags = tag.getElementsByTagName('book-collection-abbrev');
        const collectionAbbreviation = collectionAbbreviationTags[0]?.innerHTML.length
            ? collectionAbbreviationTags[0].innerHTML
            : undefined;
        if (verbose >= 2) console.log(`.. collectionAbbreviation: `, collectionAbbreviation);

        const bcStyles = tag.querySelector('styles');
        const styles = bcStyles ? parseStyles(bcStyles) : undefined;

        data.bookCollections.push({
            id: tag.id,
            collectionName,
            collectionAbbreviation,
            collectionDescription,
            features,
            books,
            languageCode,
            languageName,
            style: {
                font: stylesTag
                    .getElementsByTagName('text-font')[0]
                    .attributes.getNamedItem('family')!.value,
                lineHeight: parseInt(
                    stylesTag
                        .getElementsByTagName('line-height')[0]
                        .attributes.getNamedItem('value')!.value
                ),
                numeralSystem: stylesTag
                    .getElementsByTagName('numeral-system')[0]
                    .attributes.getNamedItem('value')!.value,
                textDirection: stylesTag
                    .getElementsByTagName('text-direction')[0]
                    .attributes.getNamedItem('value')!.value,
                textSize: parseInt(
                    stylesTag.getElementsByTagName('text-size')[0].attributes.getNamedItem('value')!
                        .value
                ),
                verseNumbers: stylesTag
                    .getElementsByTagName('verse-number-style')[0]
                    .attributes.getNamedItem('value')!.value
            },
            styles
        });
        if (verbose >= 3) console.log(`.... collection: `, JSON.stringify(data.bookCollections[0]));
    }
    if (verbose)
        console.log(
            `Converted ${data.bookCollections.length} book collections with [${data.bookCollections
                .map((x) => x.books.length)
                .join(', ')}] books`
        );

    // Menu localizations
    data.translationMappings = {};
    const translationMappingsTags = document
        .getElementsByTagName('translation-mappings')[0]
        .getElementsByTagName('tm');

    for (const tag of translationMappingsTags) {
        if (verbose >= 2) console.log(`.. translationMapping: ${tag.id}`);
        const localizations: typeof data.translationMappings.key = {};
        for (const localization of tag.getElementsByTagName('t')) {
            localizations[localization.attributes.getNamedItem('lang')!.value] =
                localization.innerHTML;
        }
        if (verbose >= 3) console.log(`....`, JSON.stringify(localizations));
        data.translationMappings[tag.id] = localizations;
    }
    if (verbose)
        console.log(
            `Converted ${Object.keys(data.translationMappings).length} translation mappings`
        );

    // Keys
    if (document.getElementsByTagName('keys').length > 0) {
        data.keys = Array.from(
            document.getElementsByTagName('keys')[0].getElementsByTagName('key')
        ).map((key) => key.innerHTML);
        if (verbose) console.log(`Converted ${data.keys.length} keys`);
    }

    /* about?: string; */

    /*
    analytics?: {
        id: string;
        name: string;
        type: string;
    }[];
    */

    // Audio Sources
    const audioSources = document
        .getElementsByTagName('audio-sources')[0]
        .getElementsByTagName('audio-source');
    if (audioSources?.length > 0) {
        data.audio = { sources: {} };
        for (const source of audioSources) {
            const id = source.getAttribute('id')!.toString();
            if (verbose >= 2) console.log(`Converting audioSource: ${id}`);
            const type = source.getAttribute('type')!.toString();
            const name = source.getElementsByTagName('name')[0].innerHTML;
            data.audio.sources[id] = {
                type: type,
                name: name
            };
            if (type !== 'assets') {
                data.audio.sources[id].accessMethods = source
                    .getElementsByTagName('access-methods')[0]
                    .getAttribute('value')!
                    .toString()
                    .split('|');
                data.audio.sources[id].folder = source.getElementsByTagName('folder')[0].innerHTML;

                if (type === 'download')
                    data.audio.sources[id].address =
                        source.getElementsByTagName('address')[0].innerHTML;
                else if (type === 'fcbh') {
                    data.audio.sources[id].key = source.getElementsByTagName('key')[0].innerHTML;
                    data.audio.sources[id].damId =
                        source.getElementsByTagName('dam-id')[0].innerHTML;
                }
            }
            if (verbose >= 3) console.log(`....`, JSON.stringify(data.audio.sources[id]));
        }
    }
    if (verbose) console.log(`Converted ${audioSources?.length} audio sources`);

    /*
    videos?: {
        id: string;
        width: number;
        height: number;
        title: string;
        thumbnail: string;
        onlineUrl: string;
        placement: {
            pos: string;
            ref: string;
            collection: number;
        };
    };
    */

    /*
    layouts?: {
        mode: string;
        enabled: boolean;
        features?: {
            [key: string]: any;
        };
    }[];
    */

    /* defaultLayout?: string; */

    // Menu Items
    const menuItems = document
        .getElementsByTagName('menu-items')[0]
        ?.getElementsByTagName('menu-item');
    if (menuItems?.length > 0) {
        data.menuItems = [];
        for (const menuItem of menuItems) {
            const type = menuItem.attributes.getNamedItem('type')!.value;
            if (verbose >= 2) console.log(`.. Converting menuItem: ${type}`);
            if (verbose >= 3) console.log('.... menuItem:', menuItem.outerHTML);

            const titleTags = menuItem.getElementsByTagName('title')[0].getElementsByTagName('t');
            const title: { [lang: string]: string } = {};
            for (const titleTag of titleTags) {
                title[titleTag.attributes.getNamedItem('lang')!.value] = titleTag.innerHTML;
            }

            const linkTags = menuItem.getElementsByTagName('link')[0]?.getElementsByTagName('t');
            const link: { [lang: string]: string } = {};
            if (linkTags) {
                for (const linkTag of linkTags) {
                    link[linkTag.attributes.getNamedItem('lang')!.value] = linkTag.innerHTML;
                }
            }

            const linkIdTags = menuItem
                .getElementsByTagName('link-id')[0]
                ?.getElementsByTagName('t');
            const linkId: { [lang: string]: string } = {};
            if (linkIdTags) {
                for (const linkIdTag of linkIdTags) {
                    linkId[linkIdTag.attributes.getNamedItem('lang')!.value] = linkIdTag.innerHTML;
                }
            }

            const imageTags = menuItem
                .getElementsByTagName('images')[0]
                ?.getElementsByTagName('image');
            const images = [];
            if (imageTags) {
                for (const imageTag of imageTags) {
                    images.push({
                        width: parseInt(imageTag.attributes.getNamedItem('width')!.value),
                        height: parseInt(imageTag.attributes.getNamedItem('height')!.value),
                        file: imageTag.innerHTML
                    });
                }
            }

            data.menuItems.push({
                type,
                title,
                link,
                linkId,
                images
            });

            if (verbose >= 3) console.log(`....`, JSON.stringify(data.menuItems));
        }
    }

    /*
    security?: {
        features?: {
            [key: string]: any;
        };
        pin: string;
        mode: string;
    };
    */

    return data;
}

export interface ConfigTaskOutput extends TaskOutput {
    data: ConfigData;
}

/**
 * Converts appdef.xml into a config object which is passed to other conversion functions
 * and is also written to src/config.js.
 */
export class ConvertConfig extends Task {
    public triggerFiles: string[] = ['appdef.xml'];
    public run(verbose: number): ConfigTaskOutput {
        const data = convertConfig(this.dataDir, verbose);
        return {
            taskName: 'ConvertConfig',
            data,
            files: [
                {
                    path: 'src/lib/data/config.js',
                    content: `export default ${JSON.stringify(data, null, 2)};`
                }
            ]
        };
    }
}
