import { userSettings } from '$lib/data/stores';

/**
 * Placeholder type since Proskomma doesn't yet use TypeScript
 * (see https://github.com/Proskomma/proskomma-json-tools/blob/main/src/render/renderers/ProskommaRenderAction.js)
 */
export type ProskommaRenderAction = {
    description: string;
    test: () => boolean;
    action: ({}: any) => void;
};

export type ProskommaRenderWorkspace = {
    root: HTMLElement;
    footnoteIndex: number;
    footnoteIdIndex: number;
    introductionIndex: number;
    firstVerse: boolean;
    currentVerse: string;
    currentPhraseIndex: number;
    milestoneLink: string;
    milestoneText: string;
    milestoneTitle: string;
    lastPhrase: string;
    introductionGraft: boolean;
    titleGraft: boolean;
    paragraphDiv: HTMLDivElement;
    titleBlockDiv: HTMLDivElement;
    titleSpan: HTMLSpanElement;
    verseDiv: HTMLDivElement;
    phraseDiv: HTMLDivElement;
    videoDiv: HTMLDivElement;
    footnoteDiv: HTMLDivElement;
    figureDiv: HTMLDivElement;
    subheaders: string[];
    textType: string[];
    headerDiv: HTMLDivElement;
    headerInnerDiv: HTMLDivElement;
    audioClips: string[];
    usfmWrapperType: string;
    showWordsOfJesus: boolean;
    lastPhraseTerminated: boolean;
    currentVideoIndex: number;
    chapterNumText: string;
    insideTable: boolean;
    inRow: boolean;
    tableElement: HTMLTableElement;
    tableRowElement: HTMLTableRowElement;
    tableCellElement: HTMLTableCellElement;
    rowCellNumber: number;
    lemma: string;
    jmpLink: string;
    jmpTitle: string;
    jmpText: string;
};

export const DefaultProskommaRenderWorkspace = {
    root: null,
    footnoteIndex: 0,
    footnoteIdIndex: 0,
    introductionIndex: 0,
    firstVerse: true,
    currentVerse: 'none',
    currentPhraseIndex: 0,
    milestoneLink: '',
    milestoneText: '',
    milestoneTitle: '',
    lastPhrase: 'a',
    introductionGraft: false,
    titleGraft: false,
    paragraphDiv: null,
    titleBlockDiv: null,
    titleSpan: null,
    verseDiv: null,
    phraseDiv: null,
    videoDiv: null,
    footnoteDiv: null,
    figureDiv: null,
    subheaders: [],
    textType: [],
    headerDiv: null,
    headerInnerDiv: null,
    audioClips: [],
    usfmWrapperType: '',
    showWordsOfJesus: false,
    lastPhraseTerminated: false,
    currentVideoIndex: 0,
    chapterNumText: '',
    insideTable: false,
    inRow: false,
    tableElement: null,
    tableRowElement: null,
    tableCellElement: null,
    rowCellNumber: 0,
    lemma: '',
    jmpLink: '',
    jmpTitle: '',
    jmpText: ''
};

export function preprocessAction(action: string, workspace: any) {
    // Table ends if row ended and anything other than start row follows it
    if (!workspace.inRow && workspace.insideTable && !(action === 'startRow')) {
        workspace.insideTable = false;
        workspace.root.appendChild(workspace.tableElement);
    }
}

export function createBookRoot(doc: Document) {
    const bookRoot = doc.createElement('div');
    bookRoot.replaceChildren();
    return bookRoot;
}
