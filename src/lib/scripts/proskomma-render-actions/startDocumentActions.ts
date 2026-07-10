import { scriptureLogs } from '$lib/data/stores/scripture.js';
import { get } from 'svelte/store';
import { preprocessAction, type ProskommaRenderAction } from './common.js';

const startDocumentActionMain: ProskommaRenderAction = {
    description: 'Set up; Book heading',
    test: () => true,
    action: ({ context, workspace }) => {
        if (get(scriptureLogs).document) {
            console.log('Start Document: %o, %o', context, context.document.metadata.document);
        }
        preprocessAction('startDocument', workspace);
        bookRoot.replaceChildren();
        workspace.root = bookRoot;
        workspace.footnoteIndex = 0;
        workspace.footnoteIdIndex = 0;
        workspace.introductionIndex = 0;
        workspace.firstVerse = true;
        workspace.currentVerse = 'none';
        workspace.currentPhraseIndex = 0;
        workspace.milestoneLink = '';
        workspace.milestoneText = '';
        workspace.milestoneTitle = '';
        workspace.lastPhrase = 'a';
        workspace.introductionGraft = false;
        workspace.titleGraft = false;
        workspace.paragraphDiv = document.createElement('div');
        workspace.titleBlockDiv = document.createElement('div');
        workspace.titleSpan = null;
        workspace.verseDiv = null;
        workspace.phraseDiv = null;
        workspace.videoDiv = null;
        workspace.footnoteDiv = null;
        workspace.figureDiv = null;
        workspace.subheaders = [];
        workspace.textType = [];
        workspace.headerDiv = null;
        workspace.headerInnerDiv = null;
        workspace.audioClips = [];
        workspace.usfmWrapperType = '';
        workspace.showWordsOfJesus = showRedLetters;
        workspace.lastPhraseTerminated = false;
        workspace.currentVideoIndex = 0;
        workspace.chapterNumText = '';
        workspace.insideTable = false;
        workspace.inRow = false;
        workspace.tableElement = null;
        workspace.tableRowElement = null;
        workspace.tableCellElement = null;
        workspace.rowCellNumber = 0;
        workspace.lemma = '';
        workspace.jmpLink = '';
        workspace.jmpTitle = '';
        workspace.jmpText = '';
        deselectAllElements(selectedVerses);

        const div = document.createElement('div');
        div.setAttribute('data-verse', 'start');
        div.setAttribute('data-phrase', 'none');
        workspace.root.append(div);
    }
};

export default startDocumentActionMain;
