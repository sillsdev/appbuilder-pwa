import { existsSync, readdirSync, readFileSync, type PathLike } from 'fs';
import path, { basename, extname } from 'path';
import type {
    AppConfig,
    BookCollectionAudioConfig,
    BookCollectionConfig,
    DictionaryConfig,
    DictionaryWritingSystemConfig,
    ScriptureConfig,
    StyleConfig,
    WritingSystemConfig
} from '$config';
import jsdom from 'jsdom';
import { convertMarkdownsToHTML } from './convertMarkdown';
import { splitVersion } from './stringUtils';
import { Task, type TaskOutput } from './Task';

const fontFamilies: string[] = [];

function decodeFromXml(input: string): string {
    return input
        .replace('&quot;', '"')
        .replace('&apos;', "'")
        .replace('&lt;', '<')
        .replace('&gt;', '>')
        .replace('&amp;', '&');
}

export function parseConfigValue(value: any) {
    if (!value.includes(':') && !isNaN(parseInt(value))) value = parseInt(value);
    else if (['true', 'false'].includes(value)) value = value === 'true' ? true : false;
    // else {} // " " split array, string, enum or time
    return value;
}
export function parseAdditionalNames(namesTag: Element, verbose: number) {
    const additionalNames = [];
    const nameTags = namesTag?.getElementsByTagName('name');
    for (const tag of nameTags) {
        const name = tag.innerHTML;
        additionalNames.push({
            name
        });
        if (verbose) {
            console.log('Book Additional Name added: ', name);
        }
    }
    return additionalNames;
}
export function parseStyles(stylesTag: Element, verbose: number) {
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
            if (propName && propValue) {
                // Check for sp values (Android-specific) and convert to rem values:
                properties[propName] = changeAndroidToRem(propValue);
                if (verbose)
                    console.log(
                        'Parsing ' + propName + ' = ' + propValue + ' -> ' + properties[propName]
                    );
            }
        }
        styles.push({
            name,
            category,
            properties
        });
    }

    return styles;
}
export function parseStylesInfo(stylesInfoTag: Element, verbose: number): StyleConfig {
    return {
        font: stylesInfoTag.getElementsByTagName('text-font')[0].attributes.getNamedItem('family')!
            .value,
        lineHeight: parseInt(
            stylesInfoTag.getElementsByTagName('line-height')[0].attributes.getNamedItem('value')!
                .value
        ),
        numeralSystem: stylesInfoTag
            .getElementsByTagName('numeral-system')[0]
            .attributes.getNamedItem('value')!.value,
        textDirection: stylesInfoTag
            .getElementsByTagName('text-direction')[0]
            .attributes.getNamedItem('value')!.value,
        textSize: parseInt(
            stylesInfoTag.getElementsByTagName('text-size')[0].attributes.getNamedItem('value')!
                .value
        ),
        verseNumbers: stylesInfoTag
            .getElementsByTagName('verse-number-style')[0]
            .attributes.getNamedItem('value')!.value
    };
}

export function parseTrait(tag: Element, name: string): string {
    const traitTags = tag.getElementsByTagName('trait');
    for (const tag of traitTags) {
        if (tag.attributes.getNamedItem('name')!.value === name) {
            return tag.attributes.getNamedItem('value')!.value;
        }
    }
    return '';
}

function dirEmpty(path: PathLike): boolean {
    let empty = true;
    if (existsSync(path)) {
        empty = readdirSync(path).length == 0;
    }
    return empty;
}

function isValidUrl(url: string): boolean {
    try {
        return Boolean(new URL(url));
    } catch (e) {
        return false;
    }
}

function removeCData(data: string) {
    return data.replace('<![CDATA[', '').replace(']]>', '');
}

function changeAndroidToRem(propValue: string) {
    const rootFontSize = 16; // Standard root font size for rem conversion

    if (propValue.endsWith('sp')) {
        const remValue = Number(propValue.replace('sp', '')) / rootFontSize;
        return `${remValue}rem`;
    } else if (propValue.endsWith('dp')) {
        const remValue = Number(propValue.replace('dp', '')) / rootFontSize;
        return `${remValue}rem`;
    } else if (propValue.endsWith('px')) {
        const remValue = Number(propValue.replace('px', '')) / rootFontSize;
        return `${remValue}rem`;
    } else if (propValue.endsWith('pt')) {
        const pxValue = Number(propValue.replace('pt', '')) * (96 / 72); // 1pt = 1/72 inch, 96px/inch
        const remValue = pxValue / rootFontSize;
        return `${remValue}rem`;
    } else if (propValue.endsWith('in')) {
        const pxValue = Number(propValue.replace('in', '')) * 96; // 96px/inch
        const remValue = pxValue / rootFontSize;
        return `${remValue}rem`;
    } else if (propValue.endsWith('mm')) {
        const pxValue = Number(propValue.replace('mm', '')) * (96 / 25.4); // 1 inch = 25.4 mm
        const remValue = pxValue / rootFontSize;
        return `${remValue}rem`;
    } else {
        // If no recognized unit, return the original value unchanged
        return propValue;
    }
}

export function convertFooter(markdown: string | undefined, appdef: Document): string | undefined {
    const footer = markdown?.length ? convertMarkdownsToHTML(removeCData(markdown)) : undefined;
    const appName = appdef.getElementsByTagName('app-name')[0].innerHTML;
    const versionName = appdef.getElementsByTagName('version')[0].getAttribute('name');
    const appDefinition = appdef.getElementsByTagName('app-definition')[0];
    const programType = appDefinition.getAttribute('type');
    const programVersion = appDefinition.getAttribute('program-version');
    return footer
        ?.replace(/\\n/g, '<br />')
        ?.replace(/%app-name%/g, appName ?? '')
        ?.replace(/%version-name%/g, versionName ?? '')
        ?.replace(/%program-type%/g, programType ?? '')
        ?.replace(/%program-version%/g, programVersion ?? '');
}

export function convertCollectionFooter(collectionTag: Element, document: Document) {
    const footerTags = Array.from(collectionTag.children).filter(
        (child) => child.tagName === 'footer'
    );
    const footer = convertFooter(footerTags[0]?.innerHTML, document);
    return footer;
}

function setConfigType(programType: string) {
    if (programType === 'SAB') {
        return {} as ScriptureConfig;
    } else if (programType === 'DAB') {
        return {} as DictionaryConfig;
    } else {
        throw new Error(`Unsupported program type parsed: ${programType}`);
    }
}

function isScriptureConfig(data: ScriptureConfig | DictionaryConfig): data is ScriptureConfig {
    return data.programType === 'SAB';
}

function isDictionaryConfig(data: ScriptureConfig | DictionaryConfig): data is DictionaryConfig {
    return data.programType === 'DAB';
}

function convertConfig(dataDir: string, verbose: number) {
    const dom = new jsdom.JSDOM(readFileSync(path.join(dataDir, 'appdef.xml')).toString(), {
        contentType: 'text/xml'
    });
    const { document } = dom.window;

    // Program info
    const appDefinition = document.getElementsByTagName('app-definition')[0];
    const programType = appDefinition.attributes.getNamedItem('type')!.value;

    // Program type determines data object type
    const data = setConfigType(programType);

    // Name
    data.name = document.getElementsByTagName('app-name')[0].innerHTML;
    if (verbose) console.log(`Converting ${data.name}...`);

    // Package
    data.package = document.getElementsByTagName('package')[0].innerHTML;
    if (verbose) console.log(`Converting ${data.package}...`);

    // Version
    data.version = document
        .getElementsByTagName('version')[0]
        .attributes.getNamedItem('name')!.value;

    data.programType = programType;
    data.programVersion = appDefinition.attributes.getNamedItem('program-version')!.value;
    if (Number.isNaN(splitVersion(data.programVersion)[0])) {
        // Development version so use a "high" number
        data.programVersion = '100.0';
    }

    data.mainFeatures = parseFeatures(document, verbose);

    data.fonts = parseFonts(document, verbose);

    const { themes, defaultTheme } = parseColorThemes(document, verbose);
    data.themes = themes;
    if (defaultTheme !== '') {
        data.defaultTheme = defaultTheme;
    }

    const mainStyles = document.querySelector('styles')!;
    data.styles = parseStyles(mainStyles, verbose);

    if (isDictionaryConfig(data)) {
        const singleEntryStyles = document.querySelector('styles[type=single-entry]');
        if (singleEntryStyles) {
            data.singleEntryStyles = parseStyles(singleEntryStyles, verbose);
        } else if (verbose) {
            console.log('No single-entry styles found in the XML document');
        }
    }

    if (isScriptureConfig(data)) {
        data.traits = parseTraits(document, dataDir, verbose);
        data.bookCollections = parseBookCollections(document, verbose);

        // After all the book collections have been parsed, we can determine some traits
        data.traits['has-glossary'] =
            data.bookCollections.filter(
                (bc) => bc.books.filter((b) => b.type === 'glossary').length > 0
            ).length > 0;
    }
    if (isDictionaryConfig(data)) {
        const writingSystems: { [key: string]: DictionaryWritingSystemConfig } = {};
        const writingSystemsTag = document.getElementsByTagName('writing-systems')[0];
        const writingSystemTags = writingSystemsTag.getElementsByTagName('writing-system');
        for (const tag of writingSystemTags) {
            const writingSystem = parseDictionaryWritingSystem(tag, verbose);
            const code: string = tag.attributes.getNamedItem('code')!.value;
            writingSystems[code] = writingSystem;
        }

        data.writingSystems = writingSystems;
        // Parsing indexes
        const indexes: { [key: string]: { displayed: boolean } } = {};
        const indexesTag = document.getElementsByTagName('indexes')[0];
        const indexTags = indexesTag.getElementsByTagName('index');
        for (const tag of indexTags) {
            const lang: string = tag.attributes.getNamedItem('lang')!.value;
            const displayed: boolean = tag.attributes.getNamedItem('displayed')!.value === 'true';
            indexes[lang] = { displayed };
        }
        data.indexes = indexes;
    }

    data.interfaceLanguages = parseInterfaceLanguages(document, data, verbose);

    data.translationMappings = parseMenuLocalizations(document, verbose);

    if (isScriptureConfig(data)) {
        data.keys = parseKeys(document, verbose);
        /* about?: string; */
        data.analytics = parseAnalytics(document, verbose);
    }

    data.firebase = parseFirebase(document, verbose);

    data.audio = { sources: {} };
    const { sources, files } = parseAudioSources(document, verbose);
    if (data.audio) {
        if (sources != null) {
            data.audio.sources = sources;
        }
        if (files.length > 0) {
            data.audio.files = files;
        }
    }

    if (isScriptureConfig(data)) {
        const videos = parseVideos(document, verbose);
        if (videos.length > 0) {
            data.videos = videos;
        }
        data.traits['has-video'] = data.videos && data.videos.length > 0;
        data.illustrations = parseIllustrations(document, verbose);

        const { layouts, defaultLayout } = parseLayouts(document, data.bookCollections, verbose);
        if (defaultLayout !== null) {
            data.defaultLayout = defaultLayout;
        }
        data.layouts = layouts;

        const backgroundImages = parseBackgroundImages(document, verbose);
        if (backgroundImages.length > 0) {
            data.backgroundImages = backgroundImages;
        }

        const watermarkImages = parseWatermarkImages(document, verbose);
        if (watermarkImages.length > 0) {
            data.watermarkImages = watermarkImages;
        }

        const menuItems = parseMenuItems(document, 'drawer', verbose);
        if (menuItems.length > 0) {
            data.menuItems = menuItems;
        }

        const bottomNavigationItems = parseMenuItems(document, 'bottom', verbose);
        if (bottomNavigationItems.length > 0) {
            data.bottomNavBarItems = bottomNavigationItems;
        }

        const { features, plans } = parsePlans(document, verbose);
        if (plans.length > 0) {
            data.plans = {
                features,
                plans
            };
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

    return filterFeaturesNotReady(data);
}

export function parseFeatures(document: Document, verbose: number) {
    const mainFeatureTags = document
        .querySelector('features[type=main]')
        ?.getElementsByTagName('e');
    if (!mainFeatureTags) throw new Error('Features tag not found in xml');
    const mainFeatures: { [key: string]: any } = {};

    for (const tag of mainFeatureTags) {
        try {
            const value: any = tag.attributes.getNamedItem('value')!.value;
            mainFeatures[tag.attributes.getNamedItem('name')!.value] = parseConfigValue(value);
        } catch (e) {
            if (e instanceof ReferenceError) {
                console.error(
                    'The main features section did not have the expected attributes `name` and `value`'
                );
            } else throw e;
        }
    }
    if (verbose) console.log(`Converted ${Object.keys(mainFeatures).length} features`);

    return mainFeatures;
}

export function parseFonts(document: Document, verbose: number) {
    const fontTags = document.getElementsByTagName('fonts')[0].getElementsByTagName('font');
    const fonts = [];

    for (const tag of fontTags) {
        const family = tag.attributes.getNamedItem('family')!.value;
        const name = tag.getElementsByTagName('display-name')[0]?.innerHTML;
        const file = tag.getElementsByTagName('f')[0].innerHTML;
        const fontStyle = tag
            .querySelector('sd[property=font-style]')!
            .attributes.getNamedItem('value')!.value;
        const fontWeight = tag
            .querySelector('sd[property=font-weight]')!
            .attributes.getNamedItem('value')!.value;
        fontFamilies.push(family);
        fonts.push({ family, name, file, fontStyle, fontWeight });
    }

    if (verbose) console.log(`Converted ${fonts.length} fonts`);

    return fonts;
}

export function parseColorThemes(document: Document, verbose: number) {
    const colorThemeTags = document
        .getElementsByTagName('color-themes')[0]
        .getElementsByTagName('color-theme');
    const colorSetTags = document.getElementsByTagName('colors');
    const themes = [];
    let defaultTheme = '';

    for (const tag of colorThemeTags) {
        const theme = tag.attributes.getNamedItem('name')!.value;
        if (verbose >= 2) console.log(`. theme ${theme}`);

        themes.push({
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
                    if (verbose >= 3) console.log(`.. colors[${name}]=${value} `);
                }
                if (verbose >= 3) console.log(`.. done with colorTags`);

                Object.keys(colors).forEach((x) => {
                    if (verbose >= 3) console.log(`.. ${x}: colors[${x}]=${colors[x]}`);
                    while (!colors[x].startsWith('#')) {
                        const key = colors[x];
                        const value = colors[key];
                        if (value === x) {
                            throw `Color value equals color name! Can't Resolve!\ncolor=${x}, theme=${theme}, value=${value} `;
                        }
                        if (!value) {
                            break;
                        }
                        colors[x] = value;
                    }
                });
                if (verbose >= 3) console.log(`.. done with resolving colors`);

                const type = cst.getAttribute('type')!;
                if (verbose >= 2) console.log(`.. ${type}: ${JSON.stringify(colors)}`);
                return {
                    type,
                    colors
                };
            })
        });

        if (tag.attributes.getNamedItem('default')?.value === 'true')
            defaultTheme = themes[themes.length - 1].name;
    }

    if (verbose) console.log(`Converted ${themes.length} themes`);

    return { themes, defaultTheme };
}

export function parseTraits(document: Document, dataDir: string, verbose: number) {
    const traitTags = document.getElementsByTagName('traits')[0]?.getElementsByTagName('trait');
    const traits: { [key: string]: any } = {};

    if (traitTags?.length > 0) {
        for (const tag of traitTags) {
            traits[tag.attributes.getNamedItem('name')!.value] =
                tag.attributes.getNamedItem('value')?.value === 'true';
        }
    }

    // Add traits
    traits['has-borders'] = !dirEmpty(path.join(dataDir, 'borders'));
    traits['has-illustrations'] = !dirEmpty(path.join(dataDir, 'illustrations'));

    if (verbose) console.log(`Converted ${Object.keys(traits).length} traits`);

    return traits;
}

export function parseBookCollections(document: Document, verbose: number) {
    const booksTags = document.getElementsByTagName('books');
    const bookCollections = [];

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
        const books: BookCollectionConfig['books'] = [];
        const bookTags = tag.getElementsByTagName('book');
        for (const book of bookTags) {
            if (verbose >= 2) console.log(`. book: ${book.id}`);
            const audio: BookCollectionAudioConfig[] = [];
            let chaptersLabels: { [key: string]: string } | undefined;
            for (const page of book.getElementsByTagName('page')) {
                if (verbose >= 2) console.log(`.. page: ${page.attributes[0].value}`);
                const char = page.attributes.getNamedItem('char')?.value;
                if (char) {
                    if (!chaptersLabels) {
                        // Initialize for the first one
                        chaptersLabels = {};
                    }
                    const chapterNum = page.attributes.getNamedItem('num')!.value;
                    chaptersLabels[chapterNum] = char;
                }
                const audioTag = page.getElementsByTagName('audio')[0];
                if (!audioTag) continue;
                const fTag = audioTag.getElementsByTagName('f')[0];
                if (verbose >= 2) {
                    console.log(`... audioTag: ${audioTag.outerHTML}, fTag:${fTag?.outerHTML}`);
                }
                if (!fTag) continue;
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
            const bookFeaturesTag = book
                .querySelector('features[type=book]')
                ?.getElementsByTagName('e');
            const bookFeatures: any = {};
            if (bookFeaturesTag) {
                for (const bookFeature of bookFeaturesTag) {
                    bookFeatures[bookFeature.attributes.getNamedItem('name')!.value] =
                        parseConfigValue(bookFeature.attributes.getNamedItem('value')!.value);
                }
            }
            const quizFeaturesTag = book
                .querySelector('features[type=quiz]')
                ?.getElementsByTagName('e');
            let quizFeatures: any;
            if (quizFeaturesTag) {
                quizFeatures = {};
                for (const quizFeature of quizFeaturesTag) {
                    quizFeatures[quizFeature.attributes.getNamedItem('name')!.value] =
                        parseConfigValue(quizFeature.attributes.getNamedItem('value')!.value);
                }
            }
            const bkStyle = book.getElementsByTagName('styles-info')[0];
            const style = bkStyle ? parseStylesInfo(bkStyle, verbose) : undefined;
            const bkStyles = book.querySelector('styles');
            const styles = bkStyles ? parseStyles(bkStyles, verbose) : undefined;
            const fontChoiceTag = book.querySelector('font-choice');
            const fonts = fontChoiceTag
                ? Array.from(fontChoiceTag.getElementsByTagName('font-choice-family'))
                      .filter((x) => fontFamilies.includes(x.innerHTML))
                      .map((x) => x.innerHTML)
                : [];
            const bkAdditionalNames = book.querySelector('additional-names');
            const additionalNames = bkAdditionalNames
                ? parseAdditionalNames(bkAdditionalNames, verbose)
                : undefined;

            const footerTags = book.getElementsByTagName('footer');
            const footer = convertFooter(footerTags[0]?.innerHTML, document);
            if (verbose >= 2) console.log(`.... footer: `, footer);

            const format = book.attributes.getNamedItem('format')?.value;
            const file = book.getElementsByTagName('f')[0]?.innerHTML;

            let chapters;
            const chaptersTag = book.getElementsByTagName('ct')[0];
            if (chaptersTag) {
                chapters = parseInt(chaptersTag.attributes.getNamedItem('c')!.value);
            }

            let chaptersN;
            const cnTag = book.getElementsByTagName('cn')[0];
            if (cnTag) {
                chaptersN = cnTag.attributes.getNamedItem('value')!.value;
            }

            books.push({
                portions: book.getElementsByTagName('portions')[0]?.attributes.getNamedItem('value')
                    ?.value,
                chapters,
                chaptersN,
                chaptersLabels,
                fonts,
                id: book.attributes.getNamedItem('id')!.value,
                type: book.attributes.getNamedItem('type')?.value,
                format,
                name: book.getElementsByTagName('n')[0]?.innerHTML,
                additionalNames,
                section: book.getElementsByTagName('sg')[0]?.innerHTML,
                testament: book.getElementsByTagName('g')[0]?.innerHTML,
                abbreviation: book.getElementsByTagName('v')[0]?.innerHTML,
                audio,
                file: format ? file : file.replace(/\.\w*$/, '.usfm'), // Default format is USFM and multiple files are combined into single .usfm
                features: bookFeatures,
                quizFeatures,
                style,
                styles,
                footer
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
        const fontChoiceTag = tag.getElementsByTagName('font-choice')[0];
        if (verbose >= 3) console.log(`.... fontChoice: `, JSON.stringify(fontChoiceTag));
        const fonts = fontChoiceTag
            ? Array.from(fontChoiceTag.getElementsByTagName('font-choice-family'))
                  .filter((x) => fontFamilies.includes(x.innerHTML))
                  .map((x) => x.innerHTML)
            : [];

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
        const footer = convertCollectionFooter(tag, document);
        if (verbose >= 2) console.log(`.. footer: `, footer);

        const collectionImageTags = tag.getElementsByTagName('image');
        const collectionImage = collectionImageTags[0]?.innerHTML.length
            ? tag.id + '-' + collectionImageTags[0].innerHTML
            : undefined;

        const bcStyles = tag.querySelector('styles');
        const styles = bcStyles ? parseStyles(bcStyles, verbose) : undefined;

        bookCollections.push({
            id: tag.id,
            collectionName,
            collectionAbbreviation,
            collectionDescription,
            collectionImage,
            features,
            books,
            fonts,
            languageCode,
            languageName,
            footer,
            style: parseStylesInfo(stylesTag, verbose),
            styles
        });
        if (verbose >= 3)
            console.log(
                `.... collection: `,
                JSON.stringify(bookCollections[bookCollections.length - 1])
            );
    }

    if (verbose)
        console.log(
            `Converted ${bookCollections.length} book collections with [${bookCollections
                .map((x) => x.books.length)
                .join(', ')}] books`
        );

    return bookCollections;
}

export function parseInterfaceLanguages(document: Document, data: AppConfig, verbose: number) {
    const interfaceLanguagesTag = document.getElementsByTagName('interface-languages')[0];
    const useSystemLanguage = parseTrait(interfaceLanguagesTag, 'use-system-language') === 'true';
    const interfaceLanguages: {
        useSystemLanguage: boolean;
        writingSystems: { [key: string]: WritingSystemConfig };
    } = { useSystemLanguage, writingSystems: {} };

    const writingSystemsTags = interfaceLanguagesTag
        .getElementsByTagName('writing-systems')[0]
        .getElementsByTagName('writing-system');

    for (const tag of writingSystemsTags) {
        const code: string = tag.attributes.getNamedItem('code')!.value;
        const writingSystem = parseWritingSystem(tag, verbose);
        interfaceLanguages.writingSystems[code] = writingSystem;

        if (verbose >= 2) {
            console.log(`.. writing system ${code}`);
        }
    }
    if (verbose)
        console.log(
            `Converted ${Object.keys(interfaceLanguages.writingSystems).length} writing systems`
        );
    return interfaceLanguages;
}

export function parseWritingSystem(element: Element, verbose: number): WritingSystemConfig {
    const type = element.attributes.getNamedItem('type')!.value;
    const fontFamily = element.getElementsByTagName('font-family')[0].innerHTML;
    const textDirection = parseTrait(element, 'text-direction');
    const displaynamesTag = element.getElementsByTagName('display-names')[0];
    const displayNames: Record<string, string> = {};
    for (const form of displaynamesTag.getElementsByTagName('form')) {
        displayNames[form.attributes.getNamedItem('lang')!.value] = form.innerHTML;
    }
    const writingSystem: WritingSystemConfig = {
        type,
        fontFamily,
        textDirection,
        displayNames
    };

    return writingSystem;
}
export function parseDictionaryWritingSystem(
    element: Element,
    verbose: number
): DictionaryWritingSystemConfig {
    const writingSystemConfig = parseWritingSystem(element, verbose);

    let sortMethod: { type: string; ignoreChars?: string[] };
    const sortMethodTag = element.getElementsByTagName('sort-method')[0];
    if (sortMethodTag) {
        const type = sortMethodTag.attributes.getNamedItem('type')?.value;
        const ignoreCharsTag = sortMethodTag.getElementsByTagName('ignore-chars')[0];
        const ignoreChars = ignoreCharsTag ? ignoreCharsTag.innerHTML.split(/\s+/) : undefined;
        sortMethod = { type: type || 'default', ignoreChars };
    } else {
        sortMethod = { type: 'default' };
    }

    const alphabetTag = element.getElementsByTagName('alphabet')[0];
    const alphabet = alphabetTag ? alphabetTag.innerHTML.split(/\s+/) : undefined;

    const inputButtonsTag = element.getElementsByTagName('input-buttons')[0];
    const inputButtons = inputButtonsTag ? inputButtonsTag.innerHTML.split(/\s+/) : undefined;

    // Parse the features
    let features: Record<string, boolean> | undefined;
    const featuresTag = element.getElementsByTagName('features')[0];
    if (featuresTag) {
        features = {};
        for (const feature of featuresTag.getElementsByTagName('e')) {
            const name = feature.getAttribute('name');
            const value = feature.getAttribute('value');
            if (name && value) {
                features[name] = value === 'true';
            }
        }
    }
    let reversalFilename: string | undefined;
    const reversalFilenameTag = element.getElementsByTagName('reversal-filename')[0];
    if (reversalFilenameTag) {
        reversalFilename = reversalFilenameTag.textContent?.trim();
    }

    return {
        ...writingSystemConfig,
        sortMethod,
        alphabet,
        inputButtons,
        features,
        reversalFilename
    };
}

export function parseMenuLocalizations(document: Document, verbose: number) {
    const translationMappingsTags = document.getElementsByTagName('translation-mappings');
    let translationMappings: {
        defaultLang: string;
        mappings: Record<string, Record<string, string>>;
    } = {
        defaultLang: '',
        mappings: {}
    };
    for (const translationMappingsTag of translationMappingsTags) {
        const defaultLang = translationMappingsTag.attributes.getNamedItem('default-lang')!.value;
        translationMappings.defaultLang = defaultLang;
        const translationMappingsTags = translationMappingsTag.getElementsByTagName('tm');

        for (const tag of translationMappingsTags) {
            if (verbose >= 2) console.log(`.. translationMapping: ${tag.id}`);
            const localizations: Record<string, string> = {};
            for (const localization of tag.getElementsByTagName('t')) {
                localizations[localization.attributes.getNamedItem('lang')!.value] = decodeFromXml(
                    localization.innerHTML
                );
            }
            if (verbose >= 3) console.log(`....`, JSON.stringify(localizations));
            translationMappings.mappings[tag.id] = localizations;
        }
        if (verbose)
            console.log(
                `Converted ${Object.keys(translationMappings.mappings).length} translation mappings`
            );
    }
    return translationMappings;
}

export function parseKeys(document: Document, verbose: number) {
    if (document.getElementsByTagName('keys').length > 0) {
        const keys = Array.from(
            document.getElementsByTagName('keys')[0].getElementsByTagName('key')
        ).map((key) => key.innerHTML);
        if (verbose) console.log(`Converted ${keys.length} keys`);

        return keys;
    }
    return [];
}

export function parseAnalytics(document: Document, verbose: number) {
    const analyticsElements = document.getElementsByTagName('analytics');

    const analytics: { enabled: boolean; providers: any[] } = {
        enabled: false,
        providers: []
    };

    for (const analyticsElement of analyticsElements) {
        const enabledAttribute = analyticsElement.getAttribute('enabled');

        if (enabledAttribute === 'true') {
            analytics.enabled = true;

            // Get all analytics-provider elements within the current analytics element
            const providerElements = analyticsElement.getElementsByTagName('analytics-provider');

            // Iterate over provider elements to construct the providers array
            for (const providerElement of providerElements) {
                // Retrieve the id, name, and type attributes from the provider element
                const id = providerElement.getAttribute('id');
                const name = providerElement.getAttribute('name');
                const type = providerElement.getAttribute('type');

                let parameters: { [key: string]: string } | undefined = undefined;
                const parametersTags = providerElement.getElementsByTagName('analytics-parameter');
                if (parametersTags.length > 0) {
                    parameters = {};
                    for (const parameterTag of parametersTags) {
                        const paramName = parameterTag.getAttribute('name')!;
                        const paramValue = parameterTag.getAttribute('value')!;
                        parameters[paramName] = paramValue;
                    }
                }

                // Add the provider to the providers array
                if (id && name && type) {
                    analytics.providers.push({ id, name, type, parameters });
                }
            }

            break; // Exit loop early if found enabled=true
        }
    }

    if (verbose) console.log(`Converted ${analyticsElements.length} analytics elements`);
    return analytics;
}

export function parseFirebase(document: Document, verbose: number) {
    const firebaseElements = document.getElementsByTagName('firebase');
    let firebase: { features: { [key: string]: any } } = { features: {} };

    // Iterate over firebaseElements and update data.firebase.features
    for (const firebaseElement of firebaseElements) {
        const featuresElements = firebaseElement.getElementsByTagName('features');

        for (const featuresElement of featuresElements) {
            const eElements = featuresElement.getElementsByTagName('e');

            for (const eElement of eElements) {
                const name = eElement.getAttribute('name');
                const value = eElement.getAttribute('value') === 'true'; // Convert string 'true'/'false' to boolean

                // Update data.firebase.features
                if (name) {
                    firebase.features[name] = value;
                }
            }
        }
    }

    if (verbose) console.log(`Converted ${firebaseElements.length} firebase elements`);
    return firebase;
}

export function parseAudioSources(document: Document, verbose: number) {
    const audioSources = document
        .getElementsByTagName('audio-sources')[0]
        ?.getElementsByTagName('audio-source');
    const sources: {
        [key: string]: {
            type: string;
            name: string;
            accessMethods?: string[];
            folder?: string;
            address?: string;
            key?: string;
            damId?: string;
        };
    } = {};
    const files: { name: string; src: string }[] = [];

    if (audioSources?.length > 0) {
        for (const source of audioSources) {
            const id = source.getAttribute('id')!;
            if (verbose >= 2) console.log(`Converting audioSource: ${id}`);
            const type = source.getAttribute('type')!;
            const name = source.getElementsByTagName('name')[0].innerHTML;

            sources[id] = { type, name };

            if (type !== 'assets') {
                sources[id].accessMethods = source
                    .getElementsByTagName('access-methods')[0]
                    ?.getAttribute('value')!
                    .toString()
                    .split('|');
                sources[id].folder = source.getElementsByTagName('folder')[0]?.innerHTML;

                const address = source.getElementsByTagName('address')[0]?.innerHTML;
                if (isValidUrl(address)) {
                    sources[id].address = address;
                }

                if (type === 'fcbh') {
                    sources[id].key = source.getElementsByTagName('key')[0].innerHTML;
                    sources[id].damId = source.getElementsByTagName('dam-id')[0].innerHTML;
                }
            }
            if (verbose >= 3) console.log(`....`, JSON.stringify(sources[id]));
        }

        // Audio files
        const audioTags = document
            .getElementsByTagName('audio-files')[0]
            ?.getElementsByTagName('audio');
        if (audioTags?.length > 0) {
            for (const tag of audioTags) {
                const fileEntry = tag.getElementsByTagName('filename')[0];
                if (!fileEntry) continue;

                const filename = fileEntry.innerHTML;
                const src = fileEntry.getAttribute('src') ?? '';
                files.push({ name: filename, src });
            }
        }
    }
    if (verbose) console.log(`Converted ${audioSources?.length} audio sources`);

    return { sources, files };
}

export function parseVideos(document: Document, verbose: number) {
    const videoTags = document.getElementsByTagName('videos')[0]?.getElementsByTagName('video');
    const videos: any[] = [];
    if (videoTags?.length > 0) {
        for (const tag of videoTags) {
            const placementTag = tag.getElementsByTagName('placement')[0];
            const placement = placementTag
                ? {
                      pos: placementTag.attributes.getNamedItem('pos')!.value,
                      ref: placementTag.attributes.getNamedItem('ref')!.value.split('|')[1],
                      collection: placementTag.attributes.getNamedItem('ref')!.value.split('|')[0]
                  }
                : undefined;

            const width = tag.getAttribute('width') ? parseInt(tag.getAttribute('width')!) : 0;
            const height = tag.getAttribute('height') ? parseInt(tag.getAttribute('height')!) : 0;

            let onlineUrl = tag.getElementsByTagName('online-url')[0]?.innerHTML || '';
            if (onlineUrl) {
                onlineUrl = convertVideoUrl(onlineUrl);
            }

            const filenameTag = tag.getElementsByTagName('filename')[0];
            const filename = filenameTag ? filenameTag.innerHTML : '';

            videos.push({
                id: tag.attributes.getNamedItem('id')!.value,
                src: tag.attributes.getNamedItem('src')?.value,
                width,
                height,
                title: tag.getElementsByTagName('title')[0]?.innerHTML,
                thumbnail: tag.getElementsByTagName('thumbnail')[0]?.innerHTML,
                onlineUrl: decodeFromXml(onlineUrl),
                filename,
                placement
            });
        }
    }
    if (verbose) console.log(`Converted ${videoTags?.length} videos`);

    return videos;
}

export function parseIllustrations(document: Document, verbose: number) {
    const imagesTags = document.getElementsByTagName('images');
    const illustrations: any[] = [];
    if (imagesTags?.length > 0) {
        for (const tag of imagesTags) {
            if (tag.getAttribute('type') === 'illustration') {
                const illustrationTags = tag.getElementsByTagName('image');

                for (const image of illustrationTags) {
                    const filename =
                        image.getElementsByTagName('filename')[0]?.innerHTML || image.innerHTML;
                    const width = image.getAttribute('width')
                        ? parseInt(image.getAttribute('width')!)
                        : 0;
                    const height = image.getAttribute('height')
                        ? parseInt(image.getAttribute('height')!)
                        : 0;

                    const placementTag = image.getElementsByTagName('placement')[0];
                    const placement = placementTag
                        ? {
                              pos: placementTag.getAttribute('pos')! || '',
                              ref: placementTag.getAttribute('ref')?.split('|')[1] || '',
                              caption: placementTag.getAttribute('caption') || '',
                              collection: placementTag.getAttribute('ref')?.split('|')[0] || ''
                          }
                        : undefined;

                    illustrations.push({ filename, width, height, placement });
                }
            }
        }
    }
    if (verbose) console.log(`Converted ${imagesTags?.length} illustrations`);
    return illustrations;
}

export function parseLayouts(document: Document, bookCollections: any, verbose: number) {
    const layoutRoot = document.getElementsByTagName('layouts')[0];
    let defaultLayout = layoutRoot?.getAttribute('default');
    const layouts = [];

    const layoutTags = layoutRoot?.getElementsByTagName('layout');
    if (layoutTags?.length > 0) {
        for (const layout of layoutTags) {
            const mode = layout.getAttribute('mode')!;
            if (verbose >= 2) console.log(`Converting layout`, mode);

            const enabled = layout.getAttribute('enabled') === 'true';

            const features: { [key: string]: string } = {};
            const featureElements = layout.getElementsByTagName('features')[0];
            if (featureElements) {
                for (const feature of featureElements.getElementsByTagName('e')) {
                    features[feature.getAttribute('name')!] = feature.getAttribute('value')!;
                }
            }

            const layoutCollectionElements = layout.getElementsByTagName('layout-collection');
            const layoutCollections =
                layoutCollectionElements.length > 0
                    ? Array.from(layoutCollectionElements).map((element) => {
                          return element.attributes.getNamedItem('id')!.value;
                      })
                    : [bookCollections[0].id];

            layouts.push({
                mode,
                enabled,
                layoutCollections,
                features
            });
        }
    }
    if (verbose) console.log(`Converted ${layoutTags?.length} layouts`);

    return { layouts, defaultLayout };
}

export function parseBackgroundImages(document: Document, verbose: number) {
    const backgroundImageTags = document
        .querySelector('images[type=background]')
        ?.getElementsByTagName('image');
    const backgroundImages = [];
    if (backgroundImageTags) {
        for (const backgroundImage of backgroundImageTags) {
            const width = backgroundImage.getAttribute('width')!;
            const height = backgroundImage.getAttribute('height')!;
            const filename = backgroundImage.innerHTML;
            backgroundImages.push({ width, height, filename });
        }
    }
    if (verbose) console.log(`Converted ${backgroundImageTags?.length} background images`);

    return backgroundImages;
}

export function parseWatermarkImages(document: Document, verbose: number) {
    const watermarkImageTags = document
        .querySelector('images[type=watermark]')
        ?.getElementsByTagName('image');
    const watermarkImages = [];
    if (watermarkImageTags) {
        for (const watermarkImage of watermarkImageTags) {
            const width = watermarkImage.getAttribute('width')!;
            const height = watermarkImage.getAttribute('height')!;
            const filename = watermarkImage.innerHTML;
            watermarkImages.push({ width, height, filename });
        }
    }
    if (verbose) console.log(`Converted ${watermarkImageTags?.length} watermark images`);

    return watermarkImages;
}

export function parseMenuItems(document: Document, type: string, verbose: number) {
    const firstMenuItemsByType = document.querySelector(`menu-items[type="${type}"]`);
    const menuItemTags = firstMenuItemsByType?.getElementsByTagName('menu-item');
    const menuItems = [];
    if (menuItemTags && menuItemTags?.length > 0) {
        for (const menuItem of menuItemTags) {
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

            menuItems.push({
                type,
                title,
                link,
                linkId,
                images
            });

            if (verbose >= 3) console.log(`....`, JSON.stringify(menuItems));
        }
    }

    return menuItems;
}

export function parsePlans(document: Document, verbose: number) {
    const features: { [key: string]: string } = {};
    const plans: {
        id: string;
        days: number;
        title: { [lang: string]: string };
        filename: string;
        jsonFilename: string;
        image?: { width: number; height: number; file: string };
    }[] = [];

    const plansTags = document.getElementsByTagName('plans');
    if (plansTags?.length > 0) {
        const plansTag = plansTags[0];
        const featuresTag = plansTag.getElementsByTagName('features')[0];
        if (featuresTag) {
            for (const feature of featuresTag.getElementsByTagName('e')) {
                const name = feature.attributes.getNamedItem('name')!.value;
                const value = feature.attributes.getNamedItem('value')!.value;
                if (verbose >= 2)
                    console.log(`.. Converting feature: name=${name}, value=${value}`);
                features[name] = value;
            }
        }

        const planTags = plansTag.getElementsByTagName('plan');
        if (planTags?.length > 0) {
            for (const tag of planTags) {
                const titleTags = tag.getElementsByTagName('title')[0].getElementsByTagName('t');
                const title: { [lang: string]: string } = {};
                for (const titleTag of titleTags) {
                    title[titleTag.attributes.getNamedItem('lang')!.value] = titleTag.innerHTML;
                }
                // Image
                const imageTag = tag.getElementsByTagName('image')[0];

                let image = undefined;
                if (imageTag?.innerHTML) {
                    image = {
                        width: Number(imageTag.attributes.getNamedItem('width')!.value),
                        height: Number(imageTag.attributes.getNamedItem('height')!.value),
                        file: imageTag.innerHTML
                    };
                }

                const filename = tag.getElementsByTagName('filename')[0].innerHTML;
                const ext = extname(filename);
                const baseFilename = basename(filename, ext);
                const jsonFilename = baseFilename + '.json';

                const plan = {
                    id: tag.attributes.getNamedItem('id')!.value,
                    days: Number(tag.attributes.getNamedItem('days')!.value),
                    title,
                    filename,
                    jsonFilename,
                    image
                };
                plans.push(plan);
            }
        }
    }

    if (verbose) console.log(`Converted ${plansTags.length} plans`);

    return { features, plans };
}

function filterFeaturesNotReady(data: ScriptureConfig | DictionaryConfig) {
    // User Accounts is not done
    data.mainFeatures['user-accounts'] = false;

    // Two pane and Verse-By-Verse are not done
    if (isScriptureConfig(data)) {
        // Two pane and Verse-By-Verse are not done
        if (data.layouts) {
            for (const layout of data.layouts) {
                if (layout.mode === 'two' || layout.mode === 'verse-by-verse') {
                    layout.enabled = false;
                }
            }
        }
        if (data.bookCollections) {
            // only allow single pane book collections
            // in SAB 12.1, the feature changed names from bc-allow-single-pane to bc-layout-allow-single-pane
            data.bookCollections = data.bookCollections.filter((collection) => {
                const allowSinglePane =
                    collection?.features['bc-allow-single-pane'] ??
                    collection?.features['bc-layout-allow-single-pane'];
                return allowSinglePane !== false;
            });
        }
    }
    // Verse on image is not done
    data.mainFeatures['text-on-image'] = false;

    // Share only implements links to apps on stores
    data.mainFeatures['share-download-app-link'] = false;
    data.mainFeatures['share-apk-file'] = false;

    // Some settings are not done
    data.mainFeatures['settings-verse-of-the-day'] = false;
    data.mainFeatures['settings-verse-of-the-day-time'] = false;
    data.mainFeatures['settings-verse-of-the-day-book-collection'] = false;
    data.mainFeatures['settings-daily-reminder'] = false;
    data.mainFeatures['settings-daily-reminder-time'] = false;
    data.mainFeatures['settings-keep-screen-on'] = false;
    data.mainFeatures['settings-share-usage-data'] = false;
    return data;
}

export interface ConfigTaskOutput extends TaskOutput {
    data: ScriptureConfig | DictionaryConfig;
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

function convertVideoUrl(url: string): string {
    // Separate patterns for different YouTube URL formats
    const youTuBePattern = /https:\/\/(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]+)(&.+)*/;
    const youTubePattern = /https:\/\/(?:www\.)?youtube\.(?:\w+)\/watch\?v=([a-zA-Z0-9_-]+)(&.+)*/;
    const vimeoPattern = /https:\/\/(?:www\.)?vimeo\.com\/([0-9]+)/;

    // Check if it's a youtu.be URL
    const youTuBeMatch = url.match(youTuBePattern);
    if (youTuBeMatch) {
        return `https://www.youtube.com/embed/${youTuBeMatch[1]}?autoplay=1`;
    }

    // Check if it's a youtube.com URL
    const youTubeMatch = url.match(youTubePattern);
    if (youTubeMatch) {
        return `https://www.youtube.com/embed/${youTubeMatch[1]}?autoplay=1`;
    }

    // Check if it's a Vimeo URL
    const vimeoMatch = url.match(vimeoPattern);
    if (vimeoMatch) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    }

    return url;
}
