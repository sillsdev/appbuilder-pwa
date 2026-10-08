import { checkSettingIs } from '$lib/data/stores';
import {
    addToScratchPad,
    FeatureSpec,
    noaction,
    renderIfRegularOrIfHackedIntro,
    type RenderWorkspace
} from '$lib/render-sofria/common';
import { addVideoLinks, createVideoBlock, createVideoBlockFromUrl } from '$lib/video';
import { getElement, matchElement, matchSequence } from './common';
import { mediaForChapter, placeElement } from './common/media';
import { terminatePhrase } from './common/text';

export const videos = new FeatureSpec<{
    milestone?: {
        currentVideoIndex?: number;
        videos?: HTMLElement[];
    };
}>(
    [
        {
            event: 'startMilestone',
            stage: 'standard',
            details: ({ context }) => ({ video: getElement(context).atts['id']?.[0] }),
            guard: ({ context, workspace }) =>
                matchElement(context, 'usfm:zvideo') && renderIfRegularOrIfHackedIntro(workspace),
            action: ({ context, workspace }) => {
                const element = getElement(context);
                const id = element.atts['id'][0];
                const video = workspace.config.videos?.find((x) => x.id === id);
                let div: HTMLElement | null = null;
                if (video) {
                    const idx = workspace.scratch.milestone?.currentVideoIndex ?? 0;
                    div = createVideoBlock(document, video, idx);
                    addToScratchPad(workspace.scratch, 'milestone', {
                        currentVideoIndex: idx + 1
                    });
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
                    const videos = workspace.scratch.milestone?.videos ?? [];
                    videos.push(div);
                    addToScratchPad(workspace.scratch, 'milestone', { videos });
                }
            }
        },
        {
            event: 'endMilestone',
            stage: 'standard',
            details: ({ context }) => ({ video: getElement(context).atts['id']?.[0] }),
            guard: ({ context, workspace }) =>
                matchElement(context, 'usfm:zvideo') && renderIfRegularOrIfHackedIntro(workspace),
            action: noaction
        },
        {
            event: 'endParagraph',
            stage: 'init',
            details: ({ workspace }) => ({
                phrase: workspace.scopeManager.find('phrase')?.root.innerText,
                videos: workspace.scratch.milestone?.videos?.length
            }),
            guard: ({ context, workspace }) =>
                matchSequence(context, 'main') && renderIfRegularOrIfHackedIntro(workspace),
            action({ workspace }) {
                terminatePhrase(workspace);
                workspace.scratch.milestone?.videos?.forEach((el) =>
                    workspace.scopeManager.appendContent(el, 'paragraph:main')
                );
                addToScratchPad(workspace.scratch, 'milestone', { videos: [] });
            }
        },
        {
            event: 'endDocument',
            stage: 'standard',
            details: ({ workspace }) => ({
                count: mediaForChapter(workspace, 'videos').length
            }),
            guard: ({ workspace }) =>
                showVideos(workspace) && renderIfRegularOrIfHackedIntro(workspace),
            action({ workspace }) {
                const videos = mediaForChapter(workspace, 'videos');
                videos.forEach((video, index) => {
                    if (video.placement) {
                        // ref can be MAT 1:1 or MAT.1.1
                        const verse = video.placement.ref.split(/[:.]/).at(-1);
                        if (verse) {
                            const videoBlockDiv = createVideoBlock(document, video, index);
                            placeElement(workspace, videoBlockDiv, video.placement.pos, verse);
                        }
                    }
                });
                addVideoLinks(workspace.document, videos);
            }
        }
    ],
    'Videos'
);

function showVideos(workspace: RenderWorkspace) {
    return (
        !workspace.viewSettings.isBibleBook ||
        checkSettingIs(workspace.stores.settings, 'display-videos-in-bible-text', 'normal')
    );
}
