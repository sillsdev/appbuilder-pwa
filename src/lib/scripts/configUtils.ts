import config from '$lib/data/config';

export function getFeatureValueBoolean(feature: string, bc: string, book: string): boolean {
    let value = false;
    if (config.mainFeatures[feature] != null) {
        value = config.mainFeatures[feature];
    }
    const bookCollectionFeatures = config.bookCollections.find((x) => x.id === bc)?.features;
    if (bookCollectionFeatures != null) {
        if (bookCollectionFeatures[feature] != null) {
            value = bookCollectionFeatures[feature];
        }
    }
    const bookFeatures = config.bookCollections
        .find((x) => x.id === bc)
        .books.find((x) => x.id === book)?.features;
    if (bookFeatures != null) {
        if (bookFeatures[feature] != null) {
            value = bookFeatures[feature];
        }
    }
    // console.log('getFeatureValueBoolean %o %o', feature, value);
    return value;
}
export function getFeatureValueString(feature: string, bc: string, book: string): string {
    let value = '';
    if (config.mainFeatures[feature] != null) {
        value = config.mainFeatures[feature];
    }
    const bookCollectionFeatures = config.bookCollections.find((x) => x.id === bc)?.features;
    if (bookCollectionFeatures != null) {
        if (bookCollectionFeatures[feature] != null) {
            value = bookCollectionFeatures[feature];
        }
    }
    const bookFeatures = config.bookCollections
        .find((x) => x.id === bc)
        .books.find((x) => x.id === book)?.features;
    if (bookFeatures != null) {
        if (bookFeatures[feature] != null) {
            value = bookFeatures[feature];
        }
    }
    // console.log('getFeatureValueString %o %o', feature, value);
    return value;
}
export function hasFeature(feature: string) {
    return config.mainFeatures[feature] != null;
}
