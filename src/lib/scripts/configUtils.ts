import config from '$lib/data/config';

export function getFeatureValueBoolean(feature: string, bc: string, book: string): boolean {
    let returnValue = false;
    let value: any = '';
    if (config.mainFeatures[feature] != null) {
        value = config.mainFeatures[feature];
    }
    const bookCollectionFeatures = config.bookCollections.find((x) => x.id === bc)?.features;
    if (bookCollectionFeatures != null) {
        const bookCollectionFeature = bookCollectionFeatures[feature];
        if (bookCollectionFeature != null && bookCollectionFeature != 'inherit') {
            value = bookCollectionFeatures[feature];
        }
    }
    const bookFeatures = config.bookCollections
        .find((x) => x.id === bc)
        .books.find((x) => x.id === book)?.features;
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
        value = config.mainFeatures[feature];
    }
    const bookCollectionFeatures = config.bookCollections.find((x) => x.id === bc)?.features;
    if (bookCollectionFeatures != null) {
        const bookCollectionFeature = bookCollectionFeatures[feature];
        if (bookCollectionFeature != null && bookCollectionFeature != 'inherit') {
            value = bookCollectionFeatures[feature];
        }
    }
    const bookFeatures = config.bookCollections
        .find((x) => x.id === bc)
        .books.find((x) => x.id === book)?.features;
    if (bookFeatures != null) {
        const bookFeature = bookFeatures[feature];
        if (bookFeature != null && bookFeature !== 'inherit') {
            value = bookFeatures[feature];
        }
    }
    // console.log('getFeatureValueString %o %o', feature, value);
    return value;
}
export function hasFeature(feature: string) {
    return config.mainFeatures[feature] != null;
}
