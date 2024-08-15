import { readFileSync, existsSync, PathLike, readdirSync } from 'fs';
import jsdom from 'jsdom';
import path from 'path';
import { Task, TaskOutput } from './Task';
import { convertMarkdownsToHTML } from './convertMarkdown';
import { splitVersion } from './stringUtils';
import type { ConfigData, BookCollectionData, BookCollectionAudioData, StyleData } from '$config';

const data: ConfigData = {};

function decodeFromXml(input: string): string {
    return input
        .replace('&quot;', '"')
        .replace('&apos;', "'")
        .replace('&lt;', '<')
        .replace('&gt;', '>')
        .replace('&amp;', '&');
}

function parseConfigValue(value: any) {
    if (!value.includes(':') && !isNaN(parseInt(value))) value = parseInt(value);
    else if (['true', 'false'].includes(value)) value = value === 'true' ? true : false;
    // else {} // " " split array, string, enum or time
    return value;
}
function parseAdditionalNames(namesTag: Element, verbose: number) {
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
function parseStyles(stylesTag: Element, verbose: number) {
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
                if (propValue.endsWith('sp')) {
                    properties[propName] = changeSpToRem(propValue);
                    if (verbose)
                        console.log(
                            'Parsing ' +
                                propName +
                                ' = ' +
                                propValue +
                                ' -> ' +
                                properties[propName]
                        );
                } else {
                    //Not a sp value
                    properties[propName] = propValue;
                }
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
function parseStylesInfo(stylesInfoTag: Element, verbose: number): StyleData {
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

function parseTrait(tag: Element, name: string): string {
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

function changeSpToRem(propValue: string) {
    // Convert Android-specific sp values to rem values
    const rootFontSize = 16;
    const remValue = Number(propValue.replace('sp', '')) / rootFontSize;
    const newPropValue = String(remValue) + 'rem';
    return newPropValue;
}

function convertFooter(markdown: string | undefined, appdef: Document): string | undefined {
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

function convertCollectionFooter(collectionTag: Element, document: Document) {
    const footerTags = Array.from(collectionTag.children).filter(
        (child) => child.tagName === 'footer'
    );
    const footer = convertFooter(footerTags[0]?.innerHTML, document);
    return footer;
}

function convertConfig(dataDir: string, verbose: number) {
    const dom = new jsdom.JSDOM(readFileSync(path.join(dataDir, 'appdef.xml')).toString(), {
        contentType: 'text/xml'
    });
    const { document } = dom.window;

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

    // Program info
    const appDefinition = document.getElementsByTagName('app-definition')[0];
    data.programType = appDefinition.attributes.getNamedItem('type')!.value;
    data.programVersion = appDefinition.attributes.getNamedItem('program-version')!.value;
    if (Number.isNaN(splitVersion(data.programVersion)[0])) {
        // Development version so use a "high" number
        data.programVersion = '100.0';
    }

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
    const fontFamilies: string[] = [];
    data.fonts = [];

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
        data.fonts.push({ family, name, file, fontStyle, fontWeight });
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
        if (verbose >= 2) console.log(`. theme ${theme}`);

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
            data.defaultTheme = data.themes[data.themes.length - 1].name;
    }
    if (verbose) console.log(`Converted ${data.themes.length} themes`);

    // Styles
    const mainStyles = document.querySelector('styles')!;
    data.styles = parseStyles(mainStyles, verbose);

    // Traits
    const traitTags = document.getElementsByTagName('traits')[0]?.getElementsByTagName('trait');
    data.traits = {};

    if (traitTags?.length > 0) {
        for (const tag of traitTags) {
            data.traits[tag.attributes.getNamedItem('name')!.value] =
                tag.attributes.getNamedItem('value')?.value === 'true';
        }
    }
    // Add traits
    data.traits['has-borders'] = !dirEmpty(path.join(dataDir, 'borders'));
    data.traits['has-illustrations'] = !dirEmpty(path.join(dataDir, 'illustrations'));

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
        const books: BookCollectionData['books'] = [];
        const bookTags = tag.getElementsByTagName('book');
        for (const book of bookTags) {
            if (verbose >= 2) console.log(`. book: ${book.id}`);
            const audio: BookCollectionAudioData[] = [];
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

            books.push({
                portions: book.getElementsByTagName('portions')[0]?.attributes.getNamedItem('value')
                    ?.value,
                chapters: parseInt(
                    book.getElementsByTagName('ct')[0].attributes.getNamedItem('c')!.value
                ),
                chaptersN: book.getElementsByTagName('cn')[0].attributes.getNamedItem('value')!
                    .value,
                fonts,
                id: book.attributes.getNamedItem('id')!.value,
                type: book.attributes.getNamedItem('type')?.value,
                name: book.getElementsByTagName('n')[0]?.innerHTML,
                additionalNames,
                section: book.getElementsByTagName('sg')[0]?.innerHTML,
                testament: book.getElementsByTagName('g')[0]?.innerHTML,
                abbreviation: book.getElementsByTagName('v')[0]?.innerHTML,
                audio,
                file: book.getElementsByTagName('f')[0]?.innerHTML.replace(/\.\w*$/, '.usfm'),
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

        data.bookCollections.push({
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
        if (verbose >= 3) console.log(`.... collection: `, JSON.stringify(data.bookCollections[0]));
    }
    // After all the book collections have been parsed, we can determine some traits
    data.traits['has-glossary'] =
        data.bookCollections.filter(
            (bc) => bc.books.filter((b) => b.type === 'glossary').length > 0
        ).length > 0;
    if (verbose)
        console.log(
            `Converted ${data.bookCollections.length} book collections with [${data.bookCollections
                .map((x) => x.books.length)
                .join(', ')}] books`
        );

    // Inteface Languages
    const interfaceLanguagesTag = document.getElementsByTagName('interface-languages')[0];
    const useSystemLanguage = parseTrait(interfaceLanguagesTag, 'use-system-language') === 'true';

    data.interfaceLanguages = { useSystemLanguage, writingSystems: {} };
    const writingSystemsTags = interfaceLanguagesTag
        .getElementsByTagName('writing-systems')[0]
        .getElementsByTagName('writing-system');
    for (const tag of writingSystemsTags) {
        const code: string = tag.attributes.getNamedItem('code')!.value;
        const fontFamily = tag.getElementsByTagName('font-family')[0].innerHTML;
        const textDirection = parseTrait(tag, 'text-direction');
        if (verbose >= 2) console.log(`.. writingSystem: ${code}`);
        const displaynamesTag = tag.getElementsByTagName('display-names')[0];
        const displayNames: typeof data.interfaceLanguages.writingSystems.displayNames.displayNames =
            {};
        for (const form of displaynamesTag.getElementsByTagName('form')) {
            displayNames[form.attributes.getNamedItem('lang')!.value] = form.innerHTML;
        }
        data.interfaceLanguages.writingSystems[code] = { fontFamily, textDirection, displayNames };
    }

    // Menu localizations
    const translationMappingsTags = document.getElementsByTagName('translation-mappings');
    for (const translationMappingsTag of translationMappingsTags) {
        const defaultLang = translationMappingsTag.attributes.getNamedItem('default-lang')!.value;
        data.translationMappings = { defaultLang, mappings: {} };
        const translationMappingsTags = translationMappingsTag.getElementsByTagName('tm');

        for (const tag of translationMappingsTags) {
            if (verbose >= 2) console.log(`.. translationMapping: ${tag.id}`);
            const localizations: typeof data.translationMappings.mappings.key = {};
            for (const localization of tag.getElementsByTagName('t')) {
                localizations[localization.attributes.getNamedItem('lang')!.value] = decodeFromXml(
                    localization.innerHTML
                );
            }
            if (verbose >= 3) console.log(`....`, JSON.stringify(localizations));
            data.translationMappings.mappings[tag.id] = localizations;
        }
        if (verbose)
            console.log(
                `Converted ${
                    Object.keys(data.translationMappings.mappings).length
                } translation mappings`
            );
    }

    // Keys
    if (document.getElementsByTagName('keys').length > 0) {
        data.keys = Array.from(
            document.getElementsByTagName('keys')[0].getElementsByTagName('key')
        ).map((key) => key.innerHTML);
        if (verbose) console.log(`Converted ${data.keys.length} keys`);
    }

    /* about?: string; */

    // Analytics
    const analyticsElements = document.getElementsByTagName('analytics');

    // Ensure data.analytics is initialized if it doesn't exist - necessary??
    if (!data.analytics) {
        data.analytics = {
            enabled: false,
            providers: []
        };
    }

    for (const analyticsElement of analyticsElements) {
        const enabledAttribute = analyticsElement.getAttribute('enabled');

        if (enabledAttribute !== null && enabledAttribute === 'true') {
            data.analytics.enabled = true;

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
                if (parametersTags?.length > 0) {
                    parameters = {};
                    for (const parameterTag of parametersTags) {
                        const name = parameterTag.getAttribute('name')!;
                        const value = parameterTag.getAttribute('value')!;
                        parameters[name] = value;
                    }
                }

                // Add the provider to the providers array
                if (id && name && type) {
                    data.analytics.providers.push({ id, name, type, parameters });
                }
            }

            break; // Exit loop early if found enabled=true
        }
    }

    if (verbose) console.log(`Converted ${analyticsElements.length} analyticsElements`);

    // Firebase
    const firebaseElements = document.getElementsByTagName('firebase');

    // Ensure data.firebase is initialized if it doesn't exist
    if (!data.firebase) {
        data.firebase = {
            features: {}
        };
    }

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
                    data.firebase.features[name] = value;
                }
            }
        }
    }

    if (verbose) console.log(`Converted ${firebaseElements.length} firebaseElements`);

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
            if (verbose >= 3) console.log(`  type=${type}, name=${name}`);
            data.audio.sources[id] = {
                type: type,
                name: name
            };
            if (type !== 'assets') {
                data.audio.sources[id].accessMethods = source
                    .getElementsByTagName('access-methods')[0]
                    ?.getAttribute('value')!
                    .toString()
                    .split('|');
                data.audio.sources[id].folder = source.getElementsByTagName('folder')[0]?.innerHTML;

                const address = source.getElementsByTagName('address')[0]?.innerHTML;
                if (isValidUrl(address)) {
                    data.audio.sources[id].address = address;
                }

                if (type === 'fcbh') {
                    data.audio.sources[id].key = source.getElementsByTagName('key')[0].innerHTML;
                    data.audio.sources[id].damId =
                        source.getElementsByTagName('dam-id')[0].innerHTML;
                }
            }
            if (verbose >= 3) console.log(`....`, JSON.stringify(data.audio.sources[id]));
        }

        const audioTags = document
            .getElementsByTagName('audio-files')[0]
            ?.getElementsByTagName('audio');
        if (audioTags?.length > 0) {
            data.audio.files = [];

            for (const tag of audioTags) {
                const fileEntry = tag.getElementsByTagName('filename')[0];
                if (!fileEntry) continue;

                const filename = fileEntry.innerHTML;
                const src = fileEntry.getAttribute('src') ?? '';

                data.audio.files.push({
                    name: filename,
                    src: src
                });
            }
        }
    }

    if (verbose) console.log(`Converted ${audioSources?.length} audio sources`);

    const videoTags = document.getElementsByTagName('videos')[0]?.getElementsByTagName('video');
    if (videoTags?.length > 0) {
        data.videos = [];

        for (const tag of videoTags) {
            const placementTag = tag.getElementsByTagName('placement')[0];
            const placement =
                placementTag == undefined
                    ? undefined
                    : {
                          pos: placementTag.attributes.getNamedItem('pos')!.value,
                          ref: placementTag.attributes.getNamedItem('ref')!.value.split('|')[1],
                          collection: placementTag.attributes
                              .getNamedItem('ref')!
                              .value.split('|')[0]
                      };
            const tagWidth = tag.attributes.getNamedItem('width')
                ? parseInt(tag.attributes.getNamedItem('width')!.value)
                : 0;
            const tagHeight = tag.attributes.getNamedItem('height')
                ? parseInt(tag.attributes.getNamedItem('height')!.value)
                : 0;
            let onlineUrlHTML = tag.getElementsByTagName('online-url')[0]
                ? tag.getElementsByTagName('online-url')[0]?.innerHTML
                : '';
            if (onlineUrlHTML) {
                onlineUrlHTML = convertVideoUrl(onlineUrlHTML);
            }
            const filenameTag = tag.getElementsByTagName('filename')[0];
            const filename = filenameTag ? filenameTag.innerHTML : '';

            data.videos.push({
                id: tag.attributes.getNamedItem('id')!.value,
                src: tag.attributes.getNamedItem('src')?.value,
                width: tagWidth,
                height: tagHeight,
                title: tag.getElementsByTagName('title')[0]?.innerHTML,
                thumbnail: tag.getElementsByTagName('thumbnail')[0]?.innerHTML,
                onlineUrl: decodeFromXml(onlineUrlHTML),
                filename: filename,
                placement
            });
        }
    }

    data.traits['has-video'] = data.videos && data.videos.length > 0;
    const imagesTags = document.getElementsByTagName('images');
    if (imagesTags?.length > 0) {
        data.illustrations = [];
        for (const tag of imagesTags) {
            const imageType = tag.attributes.getNamedItem('type')
                ? tag.attributes.getNamedItem('type')!.value
                : '';
            if (imageType === 'illustration') {
                const illustrationTags = tag.getElementsByTagName('image');
                if (illustrationTags?.length > 0) {
                    for (const image of illustrationTags) {
                        const filename = image.getElementsByTagName('filename')[0]
                            ? image.getElementsByTagName('filename')[0]?.innerHTML
                            : image.innerHTML;
                        const imageWidth = image.attributes.getNamedItem('width')
                            ? parseInt(image.attributes.getNamedItem('width')!.value)
                            : 0;
                        const imageHeight = image.attributes.getNamedItem('height')
                            ? parseInt(image.attributes.getNamedItem('height')!.value)
                            : 0;
                        const placementTag = image.getElementsByTagName('placement')[0];
                        const placement =
                            placementTag == undefined
                                ? undefined
                                : {
                                      pos: placementTag.attributes.getNamedItem('pos')!.value,
                                      ref: placementTag.attributes
                                          .getNamedItem('ref')!
                                          .value.split('|')[1],
                                      caption: placementTag.attributes.getNamedItem('caption')
                                          ? placementTag.attributes.getNamedItem('caption')!.value
                                          : '',
                                      collection: placementTag.attributes
                                          .getNamedItem('ref')!
                                          .value.split('|')[0]
                                  };
                        data.illustrations.push({
                            filename: filename,
                            width: imageWidth,
                            height: imageHeight,
                            placement
                        });
                    }
                }
            }
        }
    }
    const layoutRoot = document.getElementsByTagName('layouts')[0];
    data.defaultLayout = layoutRoot?.attributes.getNamedItem('default')?.value;

    const layouts = layoutRoot?.getElementsByTagName('layout');
    if (layouts?.length > 0) {
        data.layouts = [];
        for (const layout of layouts) {
            const mode = layout.attributes.getNamedItem('mode')!.value;
            if (verbose >= 2) console.log(`Converting layout`, mode);
            const enabled = layout.attributes.getNamedItem('enabled')!.value === 'true';
            const featureElements = layout.getElementsByTagName('features')[0];
            const features: { [key: string]: string } = {};
            if (featureElements) {
                for (const feature of featureElements.getElementsByTagName('e')) {
                    const name = feature.attributes.getNamedItem('name')!.value;
                    const value = feature.attributes.getNamedItem('value')!.value;
                    if (verbose >= 2)
                        console.log(`.. Converting feature: name=${name}, value=${value}`);
                    features[name] = value;
                }
            }
            const layoutCollectionElements = layout.getElementsByTagName('layout-collection');
            const layoutCollections =
                layoutCollectionElements.length > 0
                    ? Array.from(layoutCollectionElements).map((element) => {
                          return element.attributes.getNamedItem('id')!.value;
                      })
                    : [data.bookCollections[0].id];

            data.layouts.push({
                mode,
                enabled,
                layoutCollections,
                features
            });
        }
    }
    if (verbose) console.log(`Converted ${layouts?.length} layouts`);

    // Background images
    const backgroundImages = document
        .querySelector('images[type=background]')
        ?.getElementsByTagName('image');
    if (backgroundImages) {
        data.backgroundImages = [];
        for (const backgroundImage of backgroundImages) {
            const width = backgroundImage.getAttribute('width')!;
            const height = backgroundImage.getAttribute('height')!;
            const filename = backgroundImage.innerHTML;
            data.backgroundImages.push({ width, height, filename });
        }
    }

    // Watermark images
    const watermarkImages = document
        .querySelector('images[type=watermark]')
        ?.getElementsByTagName('image');
    if (watermarkImages) {
        data.watermarkImages = [];
        for (const watermarkImage of watermarkImages) {
            const width = watermarkImage.getAttribute('width')!;
            const height = watermarkImage.getAttribute('height')!;
            const filename = watermarkImage.innerHTML;
            data.watermarkImages.push({ width, height, filename });
        }
    }

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

    //plans
    const plansTags = document.getElementsByTagName('plans');
    if (plansTags?.length > 0) {
        const plansTag = plansTags[0];
        const featuresTag = plansTag.getElementsByTagName('features')[0];
        const features: { [key: string]: string } = {};
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
        const plans = [];
        if (planTags?.length > 0) {
            for (const tag of planTags) {
                const titleTags = tag.getElementsByTagName('title')[0].getElementsByTagName('t');
                const title: { [lang: string]: string } = {};
                for (const titleTag of titleTags) {
                    title[titleTag.attributes.getNamedItem('lang')!.value] = titleTag.innerHTML;
                }
                //image
                const imageTag = tag.getElementsByTagName('image')[0];

                let image = undefined;
                if (imageTag.innerHTML) {
                    image = {
                        width: Number(imageTag.attributes.getNamedItem('width')!.value),
                        height: Number(imageTag.attributes.getNamedItem('height')!.value),
                        file: imageTag.innerHTML
                    };
                }

                const plan = {
                    id: tag.attributes.getNamedItem('id')!.value,
                    days: Number(tag.attributes.getNamedItem('days')!.value),
                    title,
                    filename: tag.getElementsByTagName('filename')[0].innerHTML,
                    image
                };
                plans.push(plan);
            }
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

function filterFeaturesNotReady(data: ConfigData) {
    // User Accounts is not done
    data.mainFeatures['user-accounts'] = false;

    // Two pane and Verse-By-Verse are not done
    if (data.layouts) {
        for (const layout of data.layouts) {
            if (layout.mode === 'two' || layout.mode === 'verse-by-verse') {
                layout.enabled = false;
            }
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

    if (data.bookCollections) {
        // only allow single pane book collections
        // in SAB 12.1, the feature changed names from bc-allow-single-pane to bc-layout-allow-single-pane
        data.bookCollections = data.bookCollections.filter(
            (collection) =>
                collection?.features['bc-allow-single-pane'] ??
                collection?.features['bc-layout-allow-single-pane']
        );
    }
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
