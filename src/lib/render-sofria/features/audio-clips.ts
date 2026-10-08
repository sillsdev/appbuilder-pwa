import {
    addToScratchPad,
    FeatureSpec,
    renderIfRegularOrIfHackedIntro
} from '$lib/render-sofria/common';
import {
    ensureTrailingSlash,
    filenameWithoutPath,
    padWithInitialZeros
} from '$lib/scripts/stringUtils';
import { getElement, matchElement } from './common';
import { addPhrases, terminatePhrase, type SharedTextScratch } from './common/text';

const clips = import.meta.glob('./*', {
    import: 'default',
    eager: true,
    query: '?url',
    base: '/src/gen-assets/clips'
}) as Record<string, string>;

export const audioclips = new FeatureSpec<
    {
        milestone?: {
            audioClipCount?: number;
        };
    } & SharedTextScratch
>([
    {
        event: 'startMilestone',
        stage: 'standard',
        details: ({ context }) => ({ link: getElement(context).atts['link']?.[0] }),
        guard: ({ context, workspace }) =>
            matchElement(context, 'usfm:zaudioc') && renderIfRegularOrIfHackedIntro(workspace),
        action: ({ context, workspace }) => {
            const a = workspace.document.createElement('a');
            a.href = decodeURIComponent(getElement(context).atts['link'][0]);
            workspace.scopeManager.push('milestone:zaudioc', a);
        }
    },
    {
        event: 'endMilestone',
        stage: 'standard',
        details: ({ context }) => ({ link: getElement(context).atts['link']?.[0] }),
        guard: ({ context, workspace }) =>
            matchElement(context, 'usfm:zaudioc') && renderIfRegularOrIfHackedIntro(workspace),
        action: ({ workspace }) => {
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
        }
    },
    {
        event: 'text',
        stage: 'standard',
        details: ({ workspace }) => workspace.scratch.text?.cleanedText,
        guard: ({ workspace }) =>
            !workspace.scratch.text?.empty && !!workspace.scopeManager.find('milestone:zaudioc'),
        action({ workspace }) {
            addPhrases(workspace, workspace.scratch.text!.cleanedText!, {
                requireTop: true,
                newPhrase: false
            });
        }
    }
]);
