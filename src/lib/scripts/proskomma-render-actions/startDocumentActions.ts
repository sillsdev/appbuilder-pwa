import { scriptureLogs } from '$lib/data/stores/scripture.js';
import { get } from 'svelte/store';
import { deselectAllElements } from '../verseSelectUtil.js';
import { preprocessAction, type ProskommaRenderAction } from './common.js';

const startDocumentActionMain: ProskommaRenderAction = {
    description: 'Set up; Book heading',
    test: () => true,
    action: ({ context, workspace }) => {
        if (get(scriptureLogs).document) {
            console.log('Start Document: %o, %o', context, context.document.metadata.document);
        }
        preprocessAction('startDocument', workspace);
        deselectAllElements();

        const div = document.createElement('div');
        div.setAttribute('data-verse', 'start');
        div.setAttribute('data-phrase', 'none');
        workspace.root.append(div);
    }
};

export default startDocumentActionMain;
