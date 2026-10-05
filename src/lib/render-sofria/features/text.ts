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

export type SharedParaScratch = { paragraph?: { deferredEls?: HTMLElement[] } };
type TextScratch = { text?: { introductionIndex?: number; footnoteCallerIndex?: number } };

export const text = new FeatureSpec<
    {
        paragraph?: { subheadingPrefixes?: string[] };
    } & TextScratch &
        SharedParaScratch
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
                const paragraphDiv = workspace.document.createElement('div');
                paragraphDiv.classList.add(paraClass);
                if (paraClass === 'b') {
                    paragraphDiv.innerHTML += '&nbsp;';
                }

                workspace.scopeManager.push('paragraph:main', paragraphDiv);
            } else if (sequenceType === 'introduction') {
                const introductionDiv = workspace.document.createElement('div');
                introductionDiv.classList.add(paraClass);
                workspace.scopeManager.push('paragraph:introduction', introductionDiv);
            } else if (sequenceType === 'title') {
                const titleDiv = workspace.document.createElement('div');
                titleDiv.classList.add(paraClass);
                workspace.scopeManager.push('paragraph:title', titleDiv);
            } else if (sequenceType === 'heading') {
                const headerDiv = document.createElement('div');
                headerDiv.classList.add(paraClass);

                const prefix = paraClass.replaceAll(/[0-9]/g, '');
                const subheaders = workspace.scratch.paragraph?.subheadingPrefixes ?? [];
                subheaders.push(prefix);
                addToScratchPad(workspace.scratch, 'paragraph', { subheadingPrefixes: subheaders });
                const count = countSubheadingPrefixes(subheaders, prefix);

                headerDiv.id = prefix + count;
                workspace.scopeManager.push('paragraph:heading', headerDiv);
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
            // See https://community.scripture.software.sil.org/t/issues-with-cross-references-in-pwa-modern/4476
            text = text === '|default=""' ? '| ' : text;

            const subType = context.sequences[0].block.subType;

            if (workspace.logSettings.text) {
                console.log(
                    'Text element: %o %o %o',
                    context.sequences[0].element.type,
                    context.sequences[0].element.text,
                    context.sequences[0].block
                );
            }

            if (workspace.scopeManager.find('paragraph:heading') && subType === 'usfm:r') {
                // This is for usfm:r like you will find in CUK Headers
                // which contain references inline
                const headerDiv = workspace.scopeManager.find('paragraph:heading')!.root;
                headerDiv.innerHTML += generateHTML(text, 'header-ref');
            } else if (workspace.scopeManager.find('wrapper:figure')) {
                // This is a HACK!
                // see https://github.com/Proskomma/proskomma-json-tools/issues/63
                if (text !== 'NO_CAPTION') {
                    const divFigureText = createIllustrationCaptionBlock(text);
                    workspace.scopeManager.appendContent(divFigureText, 'wrapper:figure');
                }
            } else if (subType === 'usfm:x') {
                addGraftText(workspace, text, 'crossref');
            } else if (subType === 'usfm:f') {
                addGraftText(workspace, text, 'footnote');
            } else if (subType === 'usfm:tr') {
                if (workspace.scopeManager.find('wrapper:cell')) {
                    if (workspace.scopeManager.find('wrapper:xt')) {
                        const references = text.split('; ');
                        for (let i = 0; i < references.length; i++) {
                            const spanV = document.createElement('span');
                            spanV.classList.add('reflink');
                            const refText = generateHTML(text, 'header-ref');
                            spanV.innerHTML = refText;
                            // TODO spanV.addEventListener('click', onClick, false);
                            workspace.scopeManager.appendContent(spanV);
                            if (i < references.length - 1) {
                                workspace.scopeManager.appendContent(
                                    workspace.document.createTextNode('; ')
                                );
                            }
                        }
                    } else {
                        workspace.scopeManager.appendContent(
                            workspace.document.createTextNode(text)
                        );
                    }
                }
            } else if (workspace.scopeManager.find('wrapper:xt')) {
                const spanV = document.createElement('span');
                spanV.classList.add('reflink');
                const refText = generateHTML(text, 'header-ref');
                spanV.innerHTML = refText;
                const phraseDiv = getPhraseDiv(workspace);
                phraseDiv.appendChild(spanV);
                workspace.scopeManager.push('phrase', phraseDiv);
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
            terminatePhrase(workspace);
            if (sequenceType === 'main' && !workspace.hackRenderIntro) {
                workspace.scratch.paragraph?.deferredEls?.forEach((el) =>
                    workspace.scopeManager.appendContent(el, 'paragraph:main')
                );
                addToScratchPad(workspace.scratch, 'paragraph', { deferredEls: [] });

                const depth = workspace.scopeManager.depth('paragraph:main');
                switch (depth) {
                    // continuation of preexisting verse...
                    case 0:
                        {
                            const el = workspace.scopeManager
                                .at(0)
                                .root.querySelector('[data-verse]');
                            const verse = el?.getAttribute('data-verse');
                            const verseDiv = workspace.scopeManager
                                .at(1)
                                .root.querySelector(`[data-verse="${verse}"]`);
                            if (verseDiv) {
                                const paragraphDiv =
                                    workspace.scopeManager.pop('paragraph:main').root;
                                verseDiv.appendChild(paragraphDiv);
                            } else {
                                workspace.scopeManager.promoteContent('paragraph:main');
                            }
                        }
                        break;
                    // wrap paragraph with only one verse in a verse div
                    case 1:
                        {
                            const verseDiv = workspace.scopeManager.pop('verses').root;
                            workspace.scopeManager.appendChildrenFromContainer(verseDiv);
                            const paragraphDiv = workspace.scopeManager.pop('paragraph:main').root;
                            verseDiv.replaceChildren(paragraphDiv);
                            workspace.scopeManager.appendContent(verseDiv);
                        }
                        break;
                    // multiple verses in one paragraph
                    default:
                        {
                            const divs: HTMLElement[] = [];
                            for (let i = 0; i < depth; i++) {
                                divs.push(workspace.scopeManager.pop('verses').root);
                            }
                            for (let i = 0; i < depth; i++) {
                                workspace.scopeManager.appendContent(divs.pop()!);
                            }
                            workspace.scopeManager.promoteContent('paragraph:main');
                        }
                        break;
                }
            } else if (sequenceType === 'introduction') {
                workspace.scopeManager.promoteContent('paragraph:introduction');
            } else if (sequenceType === 'title') {
                workspace.scopeManager.promoteContent('paragraph:title');
            } else if (sequenceType === 'heading') {
                workspace.scopeManager.promoteContent('paragraph:heading');
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
    const previousPhrase = workspace.scopeManager.remove('phrase')?.root;
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
    const previousPhrase = workspace.scopeManager.remove('phrase')?.root;
    if (previousPhrase?.innerHTML) {
        workspace.scopeManager.appendContent(previousPhrase);
    }
}

function addPhrases(workspace: RenderWorkspace, text: string) {
    const phrases = subdividePhrases(workspace, text);
    for (const phrase of phrases) {
        const phraseDiv = getPhraseDiv(workspace);
        phraseDiv.innerHTML += phrase;

        if (phrases.length <= 1 || phraseTerminated(workspace, phrases[phrases.length - 1])) {
            workspace.scopeManager.appendContent(phraseDiv);
        } else {
            workspace.scopeManager.push('phrase', phraseDiv);
        }
    }
}

function addGraftText(workspace: RenderWorkspace, text: string, textType: 'crossref' | 'footnote') {
    const callerRoot = workspace.scopeManager.find('inlineGraft:note_caller')?.root;
    const contentRoot = workspace.scopeManager.find('inlineGraft:footnote')?.root;
    if (callerRoot && contentRoot && callerRoot.getAttribute('data-graft') === contentRoot.id) {
        const sup = callerRoot.querySelector('sup.footnote');
        if (sup && !sup.innerHTML) {
            const caller = getFootnoteCallerCharacter(workspace, text, textType);
            if (!caller) {
                // Do not include the footnote
                workspace.scopeManager.remove('inlineGraft:note_caller');
            } else {
                // Assign the caller to the footnote sup
                sup.innerHTML = caller;
            }
        } else {
            workspace.scopeManager.appendContent(workspace.document.createTextNode(text));
        }
    }
}

function getFootnoteCallerCharacter(
    workspace: RenderWorkspace<TextScratch>,
    initialCallerSymbol: string,
    footnoteType: 'crossref' | 'footnote'
) {
    const callerType =
        getFeatureValueString(
            workspace.config,
            `${footnoteType}-caller-type`,
            workspace.stores.references.collection,
            workspace.stores.references.book
        ) || 'default';
    const callerNoCallerToAuto = getFeatureValueBoolean(
        workspace.config,
        `${footnoteType}-caller-no-caller-to-auto`,
        workspace.stores.references.collection,
        workspace.stores.references.book
    );

    let callerSymbol: string | null = initialCallerSymbol;

    if (callerType === 'custom-symbol') {
        // Use whatever is specified as the custom symbol, even '-' or '+'
        // This matches native app. Sigh.
        return getFeatureValueString(
            workspace.config,
            `${footnoteType}-caller-symbol`,
            workspace.stores.references.collection,
            workspace.stores.references.book
        );
    } else if (callerType === 'abc') {
        callerSymbol = '+';
    } else if (callerNoCallerToAuto && callerSymbol === '-') {
        callerSymbol = '+';
    }

    if (callerSymbol === '-') {
        return null;
    } else if (callerSymbol === '+') {
        const idx = workspace.scratch.text?.footnoteCallerIndex ?? 0;
        addToScratchPad(workspace.scratch, 'text', { footnoteCallerIndex: idx + 1 });
        return createLetterIndex(idx);
    } else {
        return callerSymbol;
    }
}
