import { getFeatureValueBoolean, getFeatureValueString } from '$lib/scripts/configUtils';
import { generateHTML } from '$lib/scripts/scripture-reference-utils';
import {
    addToScratchPad,
    FeatureSpec,
    renderIfRegularOrIfHackedIntro,
    type RenderWorkspace
} from '../common';
import { createLetterIndex, phraseTerminated, subdividePhrases } from '../util';
import { createIllustrationCaptionBlock } from './wrappers/figures';

type TextScratch = { text?: { introductionIndex?: number; footnoteCallerIndex?: number } };

export const text = new FeatureSpec<
    {
        paragraph?: { subheadingPrefixes?: string[] };
    } & TextScratch
>([
    {
        event: 'startParagraph',
        default: true,
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ context, workspace }) {
            const sequenceType = context.sequences[0].type;
            if (workspace.logSettings.paragraph) {
                console.log('Start Paragraph %o %o', sequenceType, context.sequences[0].block);
            }
            const paraClass =
                context.sequences[0].block.subType?.split(':')[1] ||
                context.sequences[0].block.subType ||
                '';
            if (sequenceType === 'main' && !workspace.hackRenderIntro) {
                workspace.sequenceTypes.push('main');
                const paragraphDiv = workspace.document.createElement('div');
                paragraphDiv.classList.add(paraClass);
                if (paraClass === 'b') {
                    paragraphDiv.innerHTML += '&nbsp;';
                }

                workspace.scopeManager.addScope('paragraph', paragraphDiv);
            } else if (sequenceType === 'introduction') {
                const introductionDiv = workspace.document.createElement('div');
                introductionDiv.classList.add(paraClass);
                workspace.scopeManager.addScope('paragraph', introductionDiv);
            } else if (sequenceType === 'title') {
                const titleDiv = workspace.document.createElement('div');
                titleDiv.classList.add(paraClass);
                workspace.scopeManager.addScope('paragraph', titleDiv);
            } else if (sequenceType === 'heading') {
                const headerDiv = document.createElement('div');
                headerDiv.classList.add(paraClass);

                const prefix = paraClass.replaceAll(/[0-9]/g, '');
                const subheaders = workspace.scratch.paragraph?.subheadingPrefixes ?? [];
                subheaders.push(prefix);
                addToScratchPad(workspace.scratch, 'paragraph', { subheadingPrefixes: subheaders });
                const count = countSubheadingPrefixes(subheaders, prefix);

                headerDiv.id = prefix + count;
                workspace.scopeManager.addScope('paragraph', headerDiv);
            }
        }
    },
    {
        event: 'text',
        default: true,
        guard: ({ workspace, context }) =>
            renderIfRegularOrIfHackedIntro(workspace) &&
            context.sequences[0].element.text.trim().length > 0,
        action({ context, workspace }) {
            let text: string = context.sequences[0].element.text;

            // Next line is a HACK: Proskomma adds default="" to anonymous bars in text
            // See https://community.scripture.software.sil.org/t/issues-with-cross-workspace.references-in-pwa-modern/4476
            text = text === '|default=""' ? '| ' : text;

            const textType = workspace.textType.at(-1);
            const subType = context.sequences[0].block.subType;

            if (workspace.logSettings.text) {
                console.log(
                    'Text element: %o %o %o',
                    context.sequences[0].element.type,
                    context.sequences[0].element.text,
                    context.sequences[0].block
                );
                console.log('Text Type: %o', textType);
            }

            if (textType === 'heading' && subType === 'usfm:r') {
                const refText = generateHTML(text, 'header-ref');
                // This is for usfm:r like you will find in CUK Headers
                // which contain workspace.references inline
                const headerDiv = workspace.scopeManager.getScope('paragraph')?.contentRoot;
                if (headerDiv) {
                    headerDiv.innerHTML += refText;
                }
            } else if (workspace.usfmWrapperType === 'fig') {
                // This is a HACK!
                // see https://github.com/Proskomma/proskomma-json-tools/issues/63
                if (text !== 'NO_CAPTION') {
                    const divFigureText = createIllustrationCaptionBlock(text);
                    workspace.scopeManager.appendInnerContent(divFigureText, 'wrapper:figure');
                }
            } else if (subType === 'usfm:x') {
                addGraftText(workspace, text, 'xref', 'usfm:x');
            } else if (subType === 'usfm:f') {
                addGraftText(workspace, text, 'footnote', 'usfm:f');
            } else if (subType === 'usfm:tr') {
                addTableText(workspace, text);
            } else if (workspace.usfmWrapperType === 'usfm:xt') {
                const spanV = document.createElement('span');
                spanV.classList.add('reflink');
                const refText = generateHTML(text, 'header-ref');
                spanV.innerHTML = refText;
                const phraseDiv = getPhraseDiv(workspace);
                phraseDiv.appendChild(spanV);
                workspace.scopeManager.addScope('phrase', phraseDiv);
            }
            // title, heading without cross-ref, jmp, audioc, reflink, intro paras, and everything else
            else {
                addPhrases(workspace, text);
            }
        }
    },
    {
        event: 'endParagraph',
        default: true,
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ context, workspace }) {
            const sequenceType = context.sequences[0].type;
            if (workspace.logSettings.paragraph) {
                console.log('End Paragraph %o %o', sequenceType, context.sequences[0].block);
            }
            if (sequenceType === 'main' && !workspace.hackRenderIntro) {
                workspace.scopeManager.promoteContent();
                // TODO: videoDiv? verseDiv?
            } else if (sequenceType === 'introduction') {
                workspace.scopeManager.promoteContent();
            } else if (sequenceType === 'title') {
                workspace.scopeManager.promoteContent();
            } else if (sequenceType === 'heading') {
                workspace.scopeManager.promoteContent();
            }
        }
    }
]);

function countSubheadingPrefixes(subHeadings: string[], labelPrefix: string) {
    return subHeadings.reduce(
        (count, subHeading) => (subHeading === labelPrefix ? count + 1 : count),
        0
    );
}

function getPhraseDiv(workspace: RenderWorkspace) {
    const previousPhrase = workspace.scopeManager.removeScope('phrase')?.contentRoot;
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
        } else {
            phraseDiv.id = workspace.currentTextPosition.verse + phraseIndex;
            phraseDiv.setAttribute('data-verse', workspace.currentTextPosition.verse);
            phraseDiv.setAttribute('data-phrase', phraseIndex);
            phraseDiv.classList.add('txs', 'seltxt', 'scroll-item');
        }

        workspace.currentTextPosition.phraseIndex =
            (workspace.currentTextPosition.phraseIndex ?? 0) + 1;
    }
    return phraseDiv;
}

export function terminatePhrase(workspace: RenderWorkspace) {
    const previousPhrase = workspace.scopeManager.removeScope('phrase')?.contentRoot;
    if (previousPhrase?.innerHTML) {
        workspace.scopeManager.appendInnerContent(previousPhrase);
    }
}

function addPhrases(workspace: RenderWorkspace, text: string) {
    const phrases = subdividePhrases(workspace, text);
    for (const phrase of phrases) {
        const phraseDiv = getPhraseDiv(workspace);
        phraseDiv.innerHTML += phrase;

        if (!phrases.length || phraseTerminated(workspace, phrases[phrases.length - 1])) {
            workspace.scopeManager.appendInnerContent(phraseDiv);
        } else {
            workspace.scopeManager.addScope('phrase', phraseDiv);
        }
    }
}

function addTableText(workspace: RenderWorkspace, text: string) {
    if (workspace.scopeManager.getScope('cell')) {
        if (workspace.textType.includes('usfm') && workspace.usfmWrapperType === 'xt') {
            const references = text.split('; ');
            for (let i = 0; i < references.length; i++) {
                const spanV = document.createElement('span');
                spanV.classList.add('reflink');
                const refText = generateHTML(text, 'header-ref');
                spanV.innerHTML = refText;
                // TODO spanV.addEventListener('click', onClick, false);
                workspace.scopeManager.appendInnerContent(spanV);
                if (i < references.length - 1) {
                    workspace.scopeManager.appendInnerContent(
                        workspace.document.createTextNode('; ')
                    );
                }
            }
        } else {
            workspace.scopeManager.appendInnerContent(workspace.document.createTextNode(text));
        }
    }
}

function addGraftText(
    workspace: RenderWorkspace,
    text: string,
    textType: 'xref' | 'footnote',
    usfmType: string
) {
    if (workspace.textType.includes(textType)) {
        const callerRoot = workspace.scopeManager.getScope('inlineGraft:note_caller')?.contentRoot;
        const contentRoot = workspace.scopeManager.getScope('inlineGraft:footnote')?.contentRoot;
        if (callerRoot && contentRoot && callerRoot.getAttribute('data-graft') === contentRoot.id) {
            if (workspace.textType.includes('note_caller')) {
                const caller = getFootnoteCallerCharacter(workspace, text, textType);
                console.log(caller);
                if (!caller) {
                    // Do not include the footnote
                    workspace.scopeManager.removeScope('inlineGraft:note_caller');
                } else {
                    // Assign the caller to the footnote sup
                    const elements = callerRoot?.querySelectorAll('sup.footnote');
                    if (elements && elements.length > 0) {
                        elements[0].innerHTML = caller;
                    }
                }
            } else {
                workspace.scopeManager.appendInnerContent(workspace.document.createTextNode(text));
            }
        }
    } else {
        console.warn('%s ignored: %s', usfmType, text);
    }
}

function getFootnoteCallerCharacter(
    workspace: RenderWorkspace<TextScratch>,
    initialCallerSymbol: string,
    footnoteType: 'xref' | 'footnote'
) {
    let callerType = 'default';
    let callerSymbol: string | null = initialCallerSymbol;
    let callerCustomSymbol = '';
    let callerNoCallerToAuto = false;
    switch (footnoteType) {
        case 'xref':
            callerType = getFeatureValueString(
                workspace.config,
                'crossref-caller-type',
                workspace.references.collection,
                workspace.references.book
            );
            callerCustomSymbol = getFeatureValueString(
                workspace.config,
                'crossref-caller-symbol',
                workspace.references.collection,
                workspace.references.book
            );
            callerNoCallerToAuto = getFeatureValueBoolean(
                workspace.config,
                'crossref-caller-no-caller-to-auto',
                workspace.references.collection,
                workspace.references.book
            );
            break;

        default:
            callerType = getFeatureValueString(
                workspace.config,
                'footnote-caller-type',
                workspace.references.collection,
                workspace.references.book
            );
            callerCustomSymbol = getFeatureValueString(
                workspace.config,
                'footnote-caller-symbol',
                workspace.references.collection,
                workspace.references.book
            );
            callerNoCallerToAuto = getFeatureValueBoolean(
                workspace.config,
                'footnote-caller-no-caller-to-auto',
                workspace.references.collection,
                workspace.references.book
            );
            break;
    }

    if (callerType === 'custom-symbol') {
        // Use whatever is specified as the custom symbol, even '-' or '+'
        // This matches native app. Sigh.
        return callerCustomSymbol;
    } else if (callerType === 'abc') {
        callerSymbol = '+';
    } else if (callerNoCallerToAuto && callerSymbol === '-') {
        callerSymbol = '+';
    }

    if (callerSymbol === '-') {
        callerSymbol = null;
    }

    if (callerSymbol === '+') {
        const idx = workspace.scratch.text?.footnoteCallerIndex ?? 0;
        callerSymbol = createLetterIndex(idx);
        addToScratchPad(workspace.scratch, 'text', { footnoteCallerIndex: idx + 1 });
    }

    return callerSymbol;
}
