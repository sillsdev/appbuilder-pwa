import type { FeatureSpec } from './common';
import { chapterVerses } from './features/chapterVerses';
import { chapterNumber, verseNumbers } from './features/cv-numbers';
import { documentFeature } from './features/document';
import { blockGrafts } from './features/grafts';
import { inlineGrafts } from './features/grafts/inline';
import { metaContent } from './features/metaContent';
import { milestones } from './features/milestones';
import { sequences } from './features/sequence';
import { tables } from './features/table';
import { text } from './features/text';
import { figures, glossary, jmplinks, usfmWrappers } from './features/wrappers';

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
    metaContent,
    milestones
];
