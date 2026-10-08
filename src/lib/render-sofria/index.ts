import type { FeatureSpec } from './common';
import { audioclips } from './features/audio-clips';
import { chapterVerses } from './features/chapterVerses';
import { chapterNumber, verseNumbers } from './features/cv-numbers';
import { documentFeature } from './features/document';
import { glossary } from './features/glossary';
import { blockGrafts } from './features/grafts';
import { inlineGrafts } from './features/grafts/inline';
import { headings } from './features/headings';
import { illustrations, illustrationsFallback } from './features/illustrations';
import { introductions } from './features/introductions';
import { jmplinks } from './features/jmplinks';
import { metaContent } from './features/metaContent';
import { milestones } from './features/milestones';
import { reflinks } from './features/reflinks';
import { sequences } from './features/sequence';
import { tables } from './features/table';
import { text } from './features/text';
import { titles } from './features/titles';
import { videos } from './features/videos';
import { usfmWrappers } from './features/wrappers';

export const renderFeatures: Array<FeatureSpec<any>> = [
    blockGrafts,
    introductions,
    titles,
    headings,
    inlineGrafts,
    sequences,
    documentFeature,
    verseNumbers,
    chapterVerses,
    text,
    chapterNumber,
    tables,
    illustrations,
    illustrationsFallback,
    videos,
    glossary,
    jmplinks,
    usfmWrappers,
    metaContent,
    milestones,
    reflinks,
    audioclips
];
