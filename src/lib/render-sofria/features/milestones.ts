import { addToScratchPad, FeatureSpec, type RenderWorkspace } from '$lib/render-sofria/common';
import {
    ensureTrailingSlash,
    filenameWithoutPath,
    padWithInitialZeros,
    splitString
} from '$lib/scripts/stringUtils';
import { createVideoBlock, createVideoBlockFromUrl } from '$lib/video';
import { terminatePhrase } from './common/text';
import { type SharedParaScratch } from './text';

const clips = import.meta.glob('./*', {
    import: 'default',
    eager: true,
    query: '?url',
    base: '/src/gen-assets/clips'
}) as Record<string, string>;

export const milestones = new FeatureSpec<
    {
        milestone?: {
            listNums?: Record<number, number>;
            currentVideoIndex?: number;
            audioClipCount?: number;
        };
    } & SharedParaScratch
>([
    {
        event: 'startMilestone',
        section: 'fallback',
        action: ({ context, workspace }) => {
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
            } else if (element.subType === 'usfm:zaudioc') {
                const a = workspace.document.createElement('a');
                a.href = decodeURIComponent(element.atts['link'][0]);
                workspace.scopeManager.push('milestone:zaudioc', a);
            } else if (element.subType === 'usfm:zreflink') {
                const link = decodeURIComponent(element.atts['link'][0]);
                const title = decodeURIComponent(element.atts['title']?.[0] ?? '');

                const a = workspace.document.createElement('a');
                a.classList.add('web-link', 'ref-link', 'dy-tooltip');
                a.setAttribute('data-tip', title);
                a.style.display = 'inline';
                a.href = 'javascript:void(0)';
                a.addEventListener('click', function referenceLinkClickHandler(event: MouseEvent) {
                    event.stopPropagation();
                    event.preventDefault();
                    const [docSet, book, chapter, verse] = splitString(link, '.');
                    let refDocSet = workspace.stores.references.docSet;
                    const refBc = workspace.config.bookCollections?.find((x) => x.id === docSet);
                    if (refBc) {
                        refDocSet = refBc.languageCode + '_' + refBc.id;
                    } else {
                        // Invalid collection
                        return;
                    }
                    workspace.events.navigate({ docSet: refDocSet, book, chapter, verse });
                });

                workspace.scopeManager.push('milestone:zreflink', a);
            }
        }
    },
    {
        event: 'endMilestone',
        section: 'fallback',
        action: ({ context, workspace }) => {
            const element = context.sequences[0].element;
            if (element.subType === 'usfm:zcstyle') {
                workspace.scopeManager.promoteContent('milestone:zcstyle');
            } else if (element.subType === 'usfm:zaudioc') {
                terminatePhrase(workspace);
                const a = workspace.scopeManager.pop('milestone:zaudioc').root as HTMLAnchorElement;
                const filename = filenameWithoutPath(a.href);
                let src = '';

                const audioConfig = workspace.config.audio;

                if (audioConfig?.files && audioConfig?.sources) {
                    const audioFile = audioConfig.files.find((x) => x.name === filename);
                    if (audioFile) {
                        const audioSource = audioConfig.sources[audioFile.src];
                        if (audioSource) {
                            if (audioSource.type === 'assets') {
                                src = clips[`./${filename}`] ?? 'clips/' + filename;
                            } else if (audioSource.type === 'download') {
                                const address = audioSource.address;
                                src = ensureTrailingSlash(address) + filename;
                            }
                        }
                    }
                } else {
                    console.warn('Audio configuration is not properly initialized.');
                }
                if (src) {
                    const audioClipCount = (workspace.scratch.milestone?.audioClipCount ?? 0) + 1;
                    const audio = document.createElement('audio');
                    const audioId = 'audio' + padWithInitialZeros(audioClipCount.toString(), 3);

                    audio.id = audioId;
                    audio.src = src;
                    audio.setAttribute('preload', 'auto');

                    a.href = 'javascript:void(0)';
                    a.classList.add('audioclip');
                    a.addEventListener(
                        'click',
                        function remoteAudioClipHandler(event: MouseEvent) {
                            event.stopPropagation();
                            const el: HTMLAudioElement | null = workspace.root.querySelector(
                                `audio[id="${audioId}"]`
                            );
                            el?.play();
                        },
                        false
                    );

                    workspace.scopeManager.appendContent(audio);
                    workspace.scopeManager.appendContent(a);
                    addToScratchPad(workspace.scratch, 'milestone', {
                        audioClipCount
                    });
                } else {
                    console.warn(`Could not resolve audio clip: ${filename}`);
                    const span = workspace.document.createElement('span');
                    span.innerHTML = a.innerHTML;
                    workspace.scopeManager.appendContent(span);
                }
            } else if (element.subType === 'usfm:zreflink') {
                workspace.scopeManager.promoteContent('milestone:zreflink');
            }
        }
    }
]);

// handles clicks on in text markdown reference links
function referenceLinkClickHandler(workspace: RenderWorkspace, target: HTMLElement) {
    const linkRef = target.getAttribute('ref') ?? '';
    const [docSet, book, chapter, verse] = splitString(linkRef, '.');
    let refDocSet = workspace.stores.references.docSet;
    const refBc = workspace.config.bookCollections?.find((x) => x.id === docSet);
    if (refBc) {
        refDocSet = refBc.languageCode + '_' + refBc.id;
    } else {
        // Invalid collection
        return;
    }
    workspace.events.navigate({ docSet: refDocSet, book, chapter, verse });
    return;
}
