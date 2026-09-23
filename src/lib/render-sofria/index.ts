import type { FeatureSpec } from './common';
import { chapterVerses } from './features/chapterVerses';
import { documentFeature } from './features/document';
import { blockGrafts } from './features/grafts';
import { inlineGrafts } from './features/grafts/inline';
import { chapterNumber, verseNumbers } from './features/mark';
import { metaContent } from './features/metaContent';
import { sequences } from './features/sequence';
import { tables } from './features/table';
import { text } from './features/text';
import { figures, glossary, jmplinks, usfmWrappers } from './features/wrappers';

/**
 * Note: feature order matters. Subsequently listed features can depend
 * on the results of prior ones, but not vice versa
 */
export const renderFeatures: Array<FeatureSpec<any>> = [
    blockGrafts,
    inlineGrafts,
    sequences,
    documentFeature,
    verseNumbers,
    chapterVerses,
    text,
    chapterNumber,
    tables,
    figures,
    glossary,
    jmplinks,
    usfmWrappers,
    metaContent
];
