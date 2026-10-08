import { addToScratchPad, type RenderWorkspace } from '$lib/render-sofria/common';
import { createLetterIndex, phraseTerminated, subdividePhrases } from '$lib/render-sofria/util';

export type SharedTextScratch = {
    text?: { introductionIndex?: number; cleanedText?: string; empty?: boolean };
};

export function terminatePhrase(workspace: RenderWorkspace, requireTop = false) {
    const depth = workspace.scopeManager.depth('phrase');
    if (!requireTop || depth === 0) {
        const previousPhrase = workspace.scopeManager.remove('phrase')?.root;
        if (previousPhrase?.innerHTML) {
            workspace.scopeManager.at(depth).root.append(previousPhrase);
        }
    }
}

type PhraseOptions = { requireTop?: boolean; newPhrase?: boolean };

export function getPhraseDiv(
    workspace: RenderWorkspace<SharedTextScratch>,
    options: PhraseOptions = {}
) {
    const depth = workspace.scopeManager.depth('phrase');
    const { requireTop = false, newPhrase = true } = options;
    const previousPhrase =
        !requireTop || depth === 0 ? workspace.scopeManager.remove('phrase')?.root : undefined;
    const phraseDiv = previousPhrase ?? workspace.document.createElement('div');
    if (!previousPhrase) {
        const phraseIndex = createLetterIndex(workspace.currentTextPosition.phraseIndex ?? 0);

        if (workspace.hackRenderIntro) {
            const introductionIndex = workspace.scratch.text?.introductionIndex ?? 0;
            phraseDiv.id = '+' + introductionIndex;
            phraseDiv.classList.add('txs');
            addToScratchPad(workspace.scratch, 'text', {
                introductionIndex: introductionIndex + 1
            });
        } else if (newPhrase) {
            phraseDiv.id = workspace.currentTextPosition.verse + phraseIndex;
            phraseDiv.setAttribute('data-verse', workspace.currentTextPosition.verse);
            phraseDiv.setAttribute('data-phrase', phraseIndex);
            phraseDiv.classList.add('txs', 'seltxt', 'scroll-item');

            workspace.currentTextPosition.phraseIndex =
                (workspace.currentTextPosition.phraseIndex ?? 0) + 1;
        } else {
            phraseDiv.classList.add('txs');
        }
    }
    return phraseDiv;
}

export function addPhrases(
    workspace: RenderWorkspace<SharedTextScratch>,
    text: string,
    options: PhraseOptions = {}
) {
    const phrases = subdividePhrases(workspace, text);
    for (const phrase of phrases) {
        const phraseDiv = getPhraseDiv(workspace, options);
        phraseDiv.innerHTML += phrase;

        if (phrases.length <= 1 || phraseTerminated(workspace, phrases[phrases.length - 1])) {
            workspace.scopeManager.appendContent(phraseDiv);
        } else {
            workspace.scopeManager.push('phrase', phraseDiv);
        }
    }
}
