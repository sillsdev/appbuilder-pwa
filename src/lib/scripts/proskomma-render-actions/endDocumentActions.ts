import { scriptureLogs } from '$lib/data/stores';
import { get } from 'svelte/store';
import { addOnClickDivs, preprocessAction, type ProskommaRenderAction } from './common';

export function endDocumentActionMain(
    getParams: () => {
        displayingIntroduction;
        illustrations;
        docSet;
        references;
        videos;
    }
): ProskommaRenderAction {
    return {
        description: 'Set up',
        test: () => true,
        action: ({ workspace }) => {
            const params = getParams();
            if (get(scriptureLogs).document) {
                console.log('End Document');
            }
            preprocessAction('endDocument', workspace);
            addOnClickDivs();
            if (!params.displayingIntroduction) {
                addNotedVerses();
                addHighlightedVerses();
                if (showVideo()) {
                    addVideos(params.videos);
                }
                if (showImage()) {
                    addIllustrations(params.illustrations);
                }
                addPlanDiv(workspace, '-1');
            }
            addFooter(document, workspace.root, params.docSet);
            if (params.references) {
                observeVisibility();
            }
        }
    };
}

export default endDocumentActionMain;
