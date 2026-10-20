import type { FeatureSpec } from './common';
import { annotations } from './features/annotations';
import { audioclips } from './features/audio-clips';
import { characterStyles, customTags, paragraphStyles } from './features/custom-styles';
import { chapterNumber, verseNumbers } from './features/cv-numbers';
import { defaults } from './features/defaults';
import { crossrefs, footnotes, noteCallers } from './features/footnotes';
import { glossary } from './features/glossary';
import { headings } from './features/headings';
import { illustrations, illustrationsFallback } from './features/illustrations';
import { introductions } from './features/introductions';
import { jmplinks } from './features/jmplinks';
import { orderedLists, unorderedLists } from './features/lists';
import { LOGS } from './features/logging';
import { text } from './features/main-text';
import { plans } from './features/plans';
import { inlineReferences, reflinks } from './features/reflinks';
import { tables } from './features/tables';
import { titles } from './features/titles';
import { WARN_UNSUPPORTED_FEATURES } from './features/unsupported';
import { videos } from './features/videos';
import { usfmWrappers } from './features/wrappers';

export const renderFeatures: Array<FeatureSpec<any>> = [
    introductions,
    titles,
    headings,
    annotations,
    plans,
    verseNumbers,
    text,
    defaults,
    chapterNumber,
    tables,
    illustrations,
    illustrationsFallback,
    videos,
    glossary,
    jmplinks,
    usfmWrappers,
    reflinks,
    inlineReferences,
    audioclips,
    paragraphStyles,
    characterStyles,
    customTags,
    orderedLists,
    unorderedLists,
    footnotes,
    crossrefs,
    noteCallers,
    WARN_UNSUPPORTED_FEATURES,
    LOGS
];
