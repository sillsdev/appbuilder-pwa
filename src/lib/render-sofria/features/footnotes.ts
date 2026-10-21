import { getFeatureValueBoolean, getFeatureValueString } from '$lib/scripts/configUtils';
import { generateHTML } from '$lib/scripts/scripture-reference-utils';
import type { RenderContext } from 'proskomma-json-tools';
import {
    addToScratchPad,
    FeatureSpec,
    noaction,
    renderIfRegularOrIfHackedIntro,
    type RenderWorkspace
} from '../common';
import { createLetterIndex } from '../util';
import {
    extractClassName,
    extractUSFMClassName,
    getBlock,
    getElement,
    getSequence,
    matchBlock,
    matchElement,
    matchSequence
} from './common';
import { getPhraseDiv, isTopWrapper, terminatePhrase, type SharedTextScratch } from './common/text';

type FootnoteScratch = { inlineGraft?: { footnoteIdIndex?: number; typeStack?: string[] } };

export const footnotes = new FeatureSpec<FootnoteScratch & SharedTextScratch>('Footnotes', {
    inlineGraft: {
        stage: 'standard',
        details: ({ context }) => ({ type: getElement(context).subType }),
        guard: ({ context, workspace }) =>
            matchElement(context, 'footnote') && renderIfRegularOrIfHackedIntro(workspace),
        action: (environment) => {
            const { context, workspace } = environment;
            pushFootnoteScopes(context, workspace, 'footnote');

            environment.context.renderer.renderSequence(environment);

            popFootnoteScopes(workspace, 'footnote');
        }
    },
    startSequence: {
        stage: 'standard',
        details: ({ context }) => ({ type: getSequence(context).type }),
        guard: ({ context, workspace }) =>
            matchSequence(context, 'footnote') && renderIfRegularOrIfHackedIntro(workspace),
        action: noaction
    },
    endSequence: {
        stage: 'standard',
        details: ({ context }) => ({ type: getSequence(context).type }),
        guard: ({ context, workspace }) =>
            matchSequence(context, 'footnote') && renderIfRegularOrIfHackedIntro(workspace),
        action: noaction
    },
    startParagraph: {
        stage: 'standard',
        details: ({ context }) => ({ class: extractClassName(getBlock(context)) }),
        guard: ({ context, workspace }) =>
            !matchSequence(context, 'note_caller') &&
            matchBlock(context, 'usfm:f') &&
            renderIfRegularOrIfHackedIntro(workspace),
        action: noaction
    },
    endParagraph: {
        stage: 'standard',
        details: ({ context }) => ({ class: extractClassName(getBlock(context)) }),
        guard: ({ context, workspace }) =>
            !matchSequence(context, 'note_caller') &&
            matchBlock(context, 'usfm:f') &&
            renderIfRegularOrIfHackedIntro(workspace),
        action: noaction
    },
    startWrapper: {
        stage: 'standard',
        details: ({ context }) => ({ class: extractClassName(getElement(context)) }),
        guard: ({ context, workspace }) =>
            matchElement(context, /usfm:f(?!ig)/) && renderIfRegularOrIfHackedIntro(workspace),
        action: ({ context, workspace }) => {
            const usfmWrapperType = extractUSFMClassName(context);

            const spanElement = workspace.document.createElement('span');
            spanElement.classList.add(usfmWrapperType);
            workspace.scopeManager.push(`wrapper:${usfmWrapperType}`, spanElement);

            const typeStack = workspace.scratch.inlineGraft?.typeStack ?? [];
            typeStack.push(usfmWrapperType);
            addToScratchPad(workspace.scratch, 'wrapper', { typeStack });
        }
    },
    endWrapper: {
        stage: 'standard',
        details: ({ context }) => ({ class: extractClassName(getElement(context)) }),
        guard: ({ context, workspace }) =>
            matchElement(context, /usfm:f(?!ig)/) && renderIfRegularOrIfHackedIntro(workspace),
        action: ({ context, workspace }) => {
            terminatePhrase(workspace);
            workspace.scopeManager.promoteContent(`wrapper:${extractUSFMClassName(context)}`);

            const typeStack = workspace.scratch.inlineGraft?.typeStack ?? [];
            typeStack.pop();
            addToScratchPad(workspace.scratch, 'wrapper', { typeStack });
        }
    },
    text: {
        stage: 'standard',
        details: ({ workspace }) => workspace.scratch.text?.cleanedText,
        guard: ({ context, workspace }) =>
            !workspace.scratch.text?.empty &&
            !matchSequence(context, 'note_caller') &&
            matchSequence(context, 'footnote') &&
            renderIfRegularOrIfHackedIntro(workspace) &&
            isTopWrapper(workspace, `wrapper:${workspace.scratch.inlineGraft?.typeStack?.at(-1)}`),
        action({ workspace }) {
            const text: string = workspace.scratch.text!.cleanedText!;
            workspace.scopeManager.appendContent(workspace.document.createTextNode(text));
        }
    }
});

export const crossrefs = new FeatureSpec<FootnoteScratch & SharedTextScratch>('Cross-References', {
    inlineGraft: {
        stage: 'standard',
        details: ({ context }) => ({ type: getElement(context).subType }),
        guard: ({ context, workspace }) =>
            matchElement(context, 'xref') && renderIfRegularOrIfHackedIntro(workspace),
        action: (environment) => {
            const { context, workspace } = environment;
            pushFootnoteScopes(context, workspace, 'crossref');

            environment.context.renderer.renderSequence(environment);

            popFootnoteScopes(workspace, 'crossref');
        }
    },
    startSequence: {
        stage: 'standard',
        details: ({ context }) => ({ type: getSequence(context).type }),
        guard: ({ context, workspace }) =>
            matchSequence(context, 'xref') && renderIfRegularOrIfHackedIntro(workspace),
        action: noaction
    },
    endSequence: {
        stage: 'standard',
        details: ({ context }) => ({ type: getSequence(context).type }),
        guard: ({ context, workspace }) =>
            matchSequence(context, 'xref') && renderIfRegularOrIfHackedIntro(workspace),
        action: noaction
    },
    startParagraph: {
        stage: 'standard',
        details: ({ context }) => ({ class: extractClassName(getBlock(context)) }),
        guard: ({ context, workspace }) =>
            !matchSequence(context, 'note_caller') &&
            matchBlock(context, 'usfm:x') &&
            renderIfRegularOrIfHackedIntro(workspace),
        action: noaction
    },
    endParagraph: {
        stage: 'standard',
        details: ({ context }) => ({ class: extractClassName(getBlock(context)) }),
        guard: ({ context, workspace }) =>
            !matchSequence(context, 'note_caller') &&
            matchBlock(context, 'usfm:x') &&
            renderIfRegularOrIfHackedIntro(workspace),
        action: noaction
    },
    startWrapper: {
        stage: 'standard',
        details: ({ context }) => ({
            class: extractClassName(getElement(context)),
            atts: { ...getElement(context).atts }
        }),
        guard: ({ context, workspace }) =>
            matchElement(context, /usfm:x/) && renderIfRegularOrIfHackedIntro(workspace),
        action: ({ context, workspace }) => {
            const usfmWrapperType = extractUSFMClassName(context);

            const spanElement = workspace.document.createElement('span');
            spanElement.classList.add(usfmWrapperType);
            workspace.scopeManager.push(`wrapper:${usfmWrapperType}`, spanElement);

            const typeStack = workspace.scratch.inlineGraft?.typeStack ?? [];
            typeStack.push(usfmWrapperType);
            addToScratchPad(workspace.scratch, 'wrapper', { typeStack });
        }
    },
    endWrapper: {
        stage: 'standard',
        details: ({ context }) => ({ class: extractClassName(getElement(context)) }),
        guard: ({ context, workspace }) =>
            matchElement(context, /usfm:x/) && renderIfRegularOrIfHackedIntro(workspace),
        action: ({ context, workspace }) => {
            terminatePhrase(workspace);
            workspace.scopeManager.promoteContent(`wrapper:${extractUSFMClassName(context)}`);

            const typeStack = workspace.scratch.inlineGraft?.typeStack ?? [];
            typeStack.pop();
            addToScratchPad(workspace.scratch, 'wrapper', { typeStack });
        }
    },
    text: [
        {
            stage: 'standard',
            details: ({ workspace }) => workspace.scratch.text?.cleanedText,
            guard: ({ context, workspace }) =>
                !workspace.scratch.text?.empty &&
                !matchSequence(context, 'note_caller') &&
                matchSequence(context, 'xref') &&
                renderIfRegularOrIfHackedIntro(workspace) &&
                workspace.scratch.inlineGraft?.typeStack?.at(-1) !== 'xt' &&
                isTopWrapper(
                    workspace,
                    `wrapper:${workspace.scratch.inlineGraft?.typeStack?.at(-1)}`
                ),
            action({ workspace }) {
                const text: string = workspace.scratch.text!.cleanedText!;
                workspace.scopeManager.appendContent(workspace.document.createTextNode(text));
            }
        },
        {
            stage: 'standard',
            name: 'Cross-References - XT Wrapper',
            details: ({ workspace }) => workspace.scratch.text?.cleanedText,
            guard: ({ workspace }) =>
                !workspace.scratch.text?.empty &&
                isTopWrapper(workspace, 'wrapper:xt') &&
                renderIfRegularOrIfHackedIntro(workspace),
            action({ workspace }) {
                const references = workspace.scratch.text!.cleanedText!.split('; ');
                const container = workspace.scopeManager.has('wrapper:cell')
                    ? workspace.scopeManager.at(0).root
                    : getPhraseDiv(workspace, { requireTop: true, newPhrase: false });
                for (let i = 0; i < references.length; i++) {
                    const spanV = document.createElement('span');
                    spanV.classList.add('reflink');
                    spanV.innerHTML = generateHTML(references[i], 'header-ref');
                    container.appendChild(spanV);
                    if (i < references.length - 1) {
                        container.innerHTML += '; ';
                    }
                }
                if (!workspace.scopeManager.has('wrapper:cell')) {
                    workspace.scopeManager.push('phrase', container);
                }
            }
        }
    ],
    endDocument: {
        stage: 'standard',
        action({ workspace }) {
            workspace.root.querySelectorAll('a.header-ref').forEach((el) => {
                el.addEventListener('click', (e) =>
                    workspace.events.clickHeaderRef(
                        e as MouseEvent,
                        el as HTMLAnchorElement,
                        workspace
                    )
                );
            });
        }
    }
});

type CallerScratch = {
    text?: { footnoteCallerIndex?: number };
};

export const noteCallers = new FeatureSpec<CallerScratch & SharedTextScratch>('Note Callers', {
    inlineGraft: {
        stage: 'standard',
        details: ({ context }) => ({ type: getElement(context).subType }),
        guard: ({ context, workspace }) =>
            matchElement(context, 'note_caller') && renderIfRegularOrIfHackedIntro(workspace),
        action: (environment) => {
            environment.context.renderer.renderSequence(environment);
        }
    },
    startSequence: {
        stage: 'standard',
        details: ({ context }) => ({ type: getSequence(context).type }),
        guard: ({ context, workspace }) =>
            matchSequence(context, 'note_caller') && renderIfRegularOrIfHackedIntro(workspace),
        action: noaction
    },
    endSequence: {
        stage: 'standard',
        details: ({ context }) => ({ type: getSequence(context).type }),
        guard: ({ context, workspace }) =>
            matchSequence(context, 'note_caller') && renderIfRegularOrIfHackedIntro(workspace),
        action: noaction
    },
    startParagraph: {
        stage: 'standard',
        details: ({ context }) => ({ class: extractClassName(getBlock(context)) }),
        guard: ({ context, workspace }) =>
            matchSequence(context, 'note_caller') &&
            matchBlock(context, 'usfm:f') &&
            renderIfRegularOrIfHackedIntro(workspace),
        action: noaction
    },
    endParagraph: {
        stage: 'standard',
        details: ({ context }) => ({ class: extractClassName(getBlock(context)) }),
        guard: ({ context, workspace }) =>
            matchSequence(context, 'note_caller') &&
            matchBlock(context, 'usfm:f') &&
            renderIfRegularOrIfHackedIntro(workspace),
        action: noaction
    },
    text: {
        stage: 'standard',
        details: ({ workspace }) => workspace.scratch.text?.cleanedText,
        guard: ({ context, workspace }) =>
            !workspace.scratch.text?.empty &&
            matchSequence(context, 'note_caller') &&
            renderIfRegularOrIfHackedIntro(workspace),
        action({ context, workspace }) {
            const text: string = workspace.scratch.text!.cleanedText!;
            const callerRoot = workspace.scopeManager.find('inlineGraft:note_caller')?.root;
            const sup = callerRoot?.querySelector('sup.footnote');
            if (sup && !sup.innerHTML) {
                const caller = getFootnoteCallerCharacter(
                    workspace,
                    text,
                    matchBlock(context, 'usfm:x') ? 'crossref' : 'footnote'
                );
                if (!caller) {
                    // Do not include the footnote
                    workspace.scopeManager.remove('inlineGraft:note_caller');
                } else {
                    // Assign the caller to the footnote sup
                    // Add space after footnote if there are multiple footnotes.
                    // TODO: How do we tell there are multiple???
                    sup.innerHTML = caller + '\u00A0';
                }
            }
        }
    },
    endDocument: {
        stage: 'standard',
        action({ workspace }) {
            workspace.root.querySelectorAll('span[data-graft]').forEach((el) => {
                el.addEventListener('click', (e) =>
                    workspace.events.openFootnoote(e as MouseEvent, el.getAttribute('data-graft')!)
                );
            });
        }
    }
});

type FootnoteType = 'crossref' | 'footnote';

function pushFootnoteScopes(
    context: RenderContext,
    workspace: RenderWorkspace<FootnoteScratch>,
    footnoteType: FootnoteType
) {
    const element = getElement(context);
    const footnoteIdIndex = (workspace.scratch.inlineGraft?.footnoteIdIndex ?? 0) + 1;
    const footnoteId = `X-${footnoteIdIndex}`;
    addToScratchPad(workspace.scratch, 'inlineGraft', { footnoteIdIndex });
    const contentRoot = workspace.document.createElement('div');
    contentRoot.id = footnoteId;
    contentRoot.style.display = 'none';
    contentRoot.setAttribute('type', element.subType);

    const callerRoot = workspace.document.createElement('span');
    callerRoot.setAttribute('data-graft', footnoteId);
    const a = workspace.document.createElement('a');
    const sup = workspace.document.createElement('sup');
    sup.classList.add('footnote');
    a.appendChild(sup);
    a.classList.add('cursor-pointer');
    callerRoot.appendChild(a);
    workspace.scopeManager.push('inlineGraft:note_caller', callerRoot);
    workspace.scopeManager.push(`inlineGraft:${footnoteType}`, contentRoot);
}

function popFootnoteScopes(workspace: RenderWorkspace, footnoteType: FootnoteType) {
    const callerRoot = workspace.scopeManager.find('inlineGraft:note_caller')?.root;
    const contentRoot = workspace.scopeManager.pop(`inlineGraft:${footnoteType}`).root;
    if (callerRoot?.getAttribute('data-graft') === contentRoot.id) {
        workspace.scopeManager.pop('inlineGraft:note_caller');
        callerRoot.appendChild(contentRoot);
        workspace.scopeManager.appendContent(callerRoot);
    }
}

function getFootnoteCallerCharacter(
    workspace: RenderWorkspace<CallerScratch>,
    initialCallerSymbol: string,
    footnoteType: FootnoteType
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
