import { addToScratchPad, FeatureSpec } from '$lib/render-sofria/common';
import { createVideoBlock, createVideoBlockFromUrl } from '$lib/video';
import type { SharedParaScratch } from './text';

export const milestones = new FeatureSpec<
    {
        milestone?: { listNums?: Record<number, number>; currentVideoIndex?: number };
    } & SharedParaScratch
>([
    {
        event: 'startMilestone',
        default: true,
        action: ({ context, workspace }) => {
            if (workspace.logSettings.milestone) {
                console.log('Start Milestone %o', context.sequences[0].element);
            }
            const element = context.sequences[0].element;
            let match;
            if ((match = element.subType.match(/^usfm:zon(\d+)$/))) {
                const listNums = workspace.scratch.milestone?.listNums ?? {};
                listNums[parseInt(match[1])] = parseInt(element.atts['start'][0]);
                addToScratchPad(workspace.scratch, 'milestone', { listNums });
            } else if ((match = element.subType.match(/^usfm:zoli(\d+)$/))) {
                const listNums = workspace.scratch.milestone?.listNums ?? {};
                const level = parseInt(match[1]);
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
            } else if ((match = element.subType.match(/^usfm:zuli(\d+)$/))) {
                const level = parseInt(match[1]);
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
            } else if (element.subType === 'usfm:zstyle') {
                const styles = element.atts['id'] as unknown as string[];
                const para = workspace.scopeManager.find('paragraph')?.root;
                if (para) {
                    para.classList.add(...styles);
                }
            } else if (element.subType === 'usfm:zcstyle') {
                const styles = element.atts['id'] as unknown as string[];
                const span = workspace.document.createElement('span');
                span.classList.add(...styles);
                workspace.scopeManager.push('milestone:zcstyle', span);
            } else if (element.subType === 'usfm:zvideo') {
                const id = element.atts['id'][0];
                const video = workspace.config.videos?.find((x) => x.id === id);
                let div: HTMLElement | null = null;
                if (video) {
                    const idx = workspace.scratch.milestone?.currentVideoIndex ?? 0;
                    div = createVideoBlock(document, video, idx);
                    addToScratchPad(workspace.scratch, 'milestone', { currentVideoIndex: idx + 1 });
                } else {
                    // Proskomma did replacement of slashes in id
                    const videoUrl = id.replace(/÷/g, '/');
                    div = createVideoBlockFromUrl(
                        document,
                        videoUrl,
                        workspace.config.mainFeatures
                    );
                }
                if (div) {
                    const deferredEls = workspace.scratch.paragraph?.deferredEls ?? [];
                    deferredEls.push(div);
                    addToScratchPad(workspace.scratch, 'paragraph', { deferredEls });
                }
            }
        }
    },
    {
        event: 'endMilestone',
        default: true,
        action: ({ context, workspace }) => {
            const element = context.sequences[0].element;
            if (workspace.logSettings.milestone) {
                console.log('End Milestone %o', element);
            }
            if (element.subType === 'usfm:zcstyle') {
                workspace.scopeManager.promoteContent('milestone:zcstyle');
            }
        }
    }
]);
