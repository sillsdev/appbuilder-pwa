import {
    addToScratchPad,
    FeatureSpec,
    noaction,
    renderIfRegularOrIfHackedIntro
} from '$lib/render-sofria/common';
import { getElement, matchElement } from './common';

export const orderedLists = new FeatureSpec<{
    milestone?: {
        listNums?: Record<number, number>;
    };
}>('Ordered Lists', [
    {
        event: 'startMilestone',
        name: 'Set Ordered List Start',
        stage: 'standard',
        details: ({ context }) => ({
            type: getElement(context).subType,
            start: getElement(context).atts['start']?.[0]
        }),
        guard: ({ context, workspace }) =>
            matchElement(context, /^usfm:zon(\d+)$/) && renderIfRegularOrIfHackedIntro(workspace),
        action: ({ context, workspace }) => {
            const element = getElement(context);
            const level = parseInt(element.subType.match(/^usfm:zon(\d+)$/)![1]);
            const listNums = workspace.scratch.milestone?.listNums ?? {};
            listNums[level] = parseInt(element.atts['start'][0]);
            addToScratchPad(workspace.scratch, 'milestone', { listNums });
        }
    },
    {
        event: 'startMilestone',
        stage: 'standard',
        details: ({ context }) => ({ type: getElement(context).subType }),
        guard: ({ context, workspace }) =>
            matchElement(context, /^usfm:zoli(\d+)$/) && renderIfRegularOrIfHackedIntro(workspace),
        action: ({ context, workspace }) => {
            const level = parseInt(getElement(context).subType.match(/^usfm:zoli(\d+)$/)![1]);

            const listNums = workspace.scratch.milestone?.listNums ?? {};
            const para = workspace.scopeManager.find('paragraph')?.root;
            if (para) {
                para?.classList.add('list-item');
                para?.classList.add('list-decimal');
                para?.classList.add('list-inside');
                if (!listNums[level]) {
                    listNums[level] = 1;
                }
                para.style.counterSet = `list-item ${listNums[level]}`;
                para.style.paddingInlineStart = 2 * level - 1 + 'rem';

                listNums[level]++;
            }
            for (let i = level + 1; listNums[i]; i++) {
                delete listNums[i];
            } //This resets all lower-level list numbering so future lower-level lists don't continue from previous ones.

            addToScratchPad(workspace.scratch, 'milestone', { listNums });
        }
    },
    {
        event: 'endMilestone',
        stage: 'standard',
        details: ({ context }) => ({ type: getElement(context).subType }),
        guard: ({ context, workspace }) =>
            (matchElement(context, /^usfm:zoli(\d+)$/) ||
                matchElement(context, /^usfm:zon(\d+)$/)) &&
            renderIfRegularOrIfHackedIntro(workspace),
        action: noaction
    }
]);

export const unorderedLists = new FeatureSpec('Unordered Lists', [
    {
        event: 'startMilestone',
        stage: 'standard',
        details: ({ context }) => ({ type: getElement(context).subType }),
        guard: ({ context, workspace }) =>
            matchElement(context, /^usfm:zuli(\d+)$/) && renderIfRegularOrIfHackedIntro(workspace),
        action: ({ context, workspace }) => {
            const level = parseInt(getElement(context).subType.match(/^usfm:zuli(\d+)$/)![1]);
            const para = workspace.scopeManager.find('paragraph')?.root;
            if (para) {
                para.classList.add('list-item');
                para.classList.add('list-inside');

                para.style.paddingInlineStart = 2 * level - 1 + 'rem';
                if (level === 2) {
                    para.classList.add('list-[circle]');
                } else if (level >= 3) {
                    para.classList.add('list-[square]');
                }
            }
        }
    },
    {
        event: 'endMilestone',
        stage: 'standard',
        details: ({ context }) => ({ type: getElement(context).subType }),
        guard: ({ context, workspace }) =>
            matchElement(context, /^usfm:zuli(\d+)$/) && renderIfRegularOrIfHackedIntro(workspace),
        action: noaction
    }
]);
