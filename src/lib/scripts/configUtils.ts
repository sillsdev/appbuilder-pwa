import config, { scriptureConfig } from '$assets/config';
import type { BookCollectionConfig, BookConfig, ScriptureConfig, StyleConfig } from '$config';

export function getFeatureValueBoolean(feature: string, bc: string, book: string): boolean {
    let returnValue = false;
    let value: any = '';
    if (config.mainFeatures[feature] != null) {
        value = config.mainFeatures[feature];
    }
    const bookCollectionFeatures = scriptureConfig.bookCollections?.find(
        (x) => x.id === bc
    )?.features;
    if (bookCollectionFeatures != null) {
        const bookCollectionFeature = bookCollectionFeatures[feature];
        if (bookCollectionFeature != null && bookCollectionFeature != 'inherit') {
            value = bookCollectionFeatures[feature];
        }
    }
    const bookFeatures = scriptureConfig.bookCollections
        ?.find((x) => x.id === bc)
        ?.books.find((x) => x.id === book)?.features;
    if (bookFeatures != null) {
        const bookFeature = bookFeatures[feature];
        if (bookFeature != null && bookFeature !== 'inherit') {
            value = bookFeatures[feature];
        }
    }

    if (value === true || value === 'yes') {
        returnValue = true;
    }
    // console.log('getFeatureValueBoolean %o %o %o', feature, value, returnValue);

    return returnValue;
}
export function getFeatureValueString(feature: string, bc: string, book: string): string {
    let value = '';
    if (config.mainFeatures[feature] != null) {
        value = config.mainFeatures[feature] as string;
    }
    const bookCollectionFeatures = scriptureConfig.bookCollections?.find(
        (x) => x.id === bc
    )?.features;
    if (bookCollectionFeatures != null) {
        const bookCollectionFeature = bookCollectionFeatures[feature];
        if (bookCollectionFeature != null && bookCollectionFeature != 'inherit') {
            value = bookCollectionFeatures[feature];
        }
    }
    const bookFeatures = scriptureConfig.bookCollections
        ?.find((x) => x.id === bc)
        ?.books.find((x) => x.id === book)?.features;
    if (bookFeatures != null) {
        const bookFeature = bookFeatures[feature];
        if (bookFeature != null && bookFeature !== 'inherit') {
            value = bookFeatures[feature] as string;
        }
    }
    // console.log('getFeatureValueString %o %o', feature, value);
    return value;
}
export function hasFeature(feature: string) {
    return config.mainFeatures[feature] != null;
}

// Make config a parameter for testing.
export function getStyle(
    configData: {
        bookCollections: (Pick<BookCollectionConfig, 'id'> & {
            style?: Partial<StyleConfig>;
            books: (Pick<BookConfig, 'id'> & { style?: Partial<StyleConfig> })[];
        })[];
    },
    option: keyof StyleConfig,
    bc: string,
    book: string
): string | number {
    const bcData = configData.bookCollections?.find((x) => x.id === bc);
    const bookData = bcData?.books.find((x) => x.id === book);
    // Use the style of the book, if defined.
    if (bookData?.style?.[option] && bookData.style[option] !== 'inherit') {
        return bookData.style[option];
    }
    // Otherwise, fall back on the collection style
    if (bcData?.style?.[option]) {
        return bcData.style[option];
    }
    // No style was found.
    return '';
}
