import type { FeatureSpec } from './common';
import { audioclips } from './features/audio-clips';
import { characterStyles, paragraphStyles } from './features/custom-styles';
import { chapterNumber, verseNumbers } from './features/cv-numbers';
import { documentFeature } from './features/document';
import { crossrefs, footnotes, noteCallers } from './features/footnotes';
import { glossary } from './features/glossary';
import { headings } from './features/headings';
import { illustrations, illustrationsFallback } from './features/illustrations';
import { introductions } from './features/introductions';
import { jmplinks } from './features/jmplinks';
import { orderedLists, unorderedLists } from './features/lists';
import { LOGS } from './features/logging';
import { reflinks } from './features/reflinks';
import { sequences } from './features/sequence';
import { tables } from './features/tables';
import { text } from './features/text';
import { titles } from './features/titles';
import { WARN_UNSUPPORTED_FEATURES } from './features/unsupported';
import { verses } from './features/verses';
import { videos } from './features/videos';
import { usfmWrappers } from './features/wrappers';

export const renderFeatures: Array<FeatureSpec<any>> = [
    introductions,
    titles,
    headings,
    sequences,
    documentFeature,
    verseNumbers,
    verses,
    text,
    chapterNumber,
    tables,
    illustrations,
    illustrationsFallback,
    videos,
    glossary,
    jmplinks,
    usfmWrappers,
    reflinks,
    audioclips,
    paragraphStyles,
    characterStyles,
    orderedLists,
    unorderedLists,
    footnotes,
    crossrefs,
    noteCallers,
    WARN_UNSUPPORTED_FEATURES,
    LOGS
];
