import type { FeatureSpec } from './common';
import { chapterVerses } from './features/chapterVerses';
import { documentFeature } from './features/document';
import { chapterNumber, verseNumbers } from './features/mark';
import { sequences } from './features/sequence';
import { text } from './features/text';

/**
 * Note: feature order matters. Subsequently listed features can depend
 * on the results of prior ones, but not vice versa
 */
export const renderFeatures: Array<FeatureSpec> = [
    sequences,
    documentFeature,
    verseNumbers,
    chapterVerses,
    text,
    chapterNumber
];
