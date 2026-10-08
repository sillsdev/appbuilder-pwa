import type { FeatureSpec } from './common';
import { chapterVerses } from './features/chapterVerses';
import { chapterNumber, verseNumbers } from './features/cv-numbers';
import { documentFeature } from './features/document';
import { glossary } from './features/glossary';
import { blockGrafts } from './features/grafts';
import { inlineGrafts } from './features/grafts/inline';
import { illustrations } from './features/illustrations';
import { metaContent } from './features/metaContent';
import { milestones } from './features/milestones';
import { sequences } from './features/sequence';
import { tables } from './features/table';
import { text } from './features/text';
import { jmplinks, usfmWrappers } from './features/wrappers';

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
    illustrations,
    glossary,
    jmplinks,
    usfmWrappers,
    metaContent,
    milestones
];
