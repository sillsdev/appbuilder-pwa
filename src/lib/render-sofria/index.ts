import chapterNumberFeature from './ChapterNumberFeature';
import type { FeatureSpec } from './common';
import documentFeature from './DocumentFeature';
import loggingFeature from './LoggingFeature';
import mainTextFeature from './MainTextFeature';
import textPositionFeature from './TextPositionFeature';

/**
 * Note: feature order matters. Subsequently listed features can depend
 * on the results of prior ones, but not vice versa
 */
export const renderFeatures: Array<FeatureSpec> = [
    loggingFeature,
    documentFeature,
    textPositionFeature,
    mainTextFeature,
    chapterNumberFeature
];
