import { FeatureSpec, renderIfRegularOrIfHackedIntro } from '$lib/render-sofria/common';
import { generateReferenceLinkHTML } from '$lib/scripts/scripture-reference-utils';
import { splitString } from '$lib/scripts/stringUtils';
import { extractClassName, getElement, matchElement } from './common';
import { addPhrases, isTopWrapper, terminatePhrase, type SharedTextScratch } from './common/text';

export const reflinks = new FeatureSpec<SharedTextScratch>('Reference Links', {
    startMilestone: {
        stage: 'standard',
        details: ({ context }) => ({
            link: getElement(context).atts['link']?.[0],
            title: getElement(context).atts['title']?.[0]
        }),
        guard: ({ context, workspace }) =>
            matchElement(context, 'usfm:zreflink') && renderIfRegularOrIfHackedIntro(workspace),
        action: ({ context, workspace }) => {
            const element = getElement(context);
            let link = element.atts['link']?.[0] ?? '';
            try {
                link = decodeURIComponent(link);
            } catch {
                // empty
            }
            let title = element.atts['title']?.[0] ?? '';
            try {
                title = decodeURIComponent(title);
            } catch {
                // empty
            }

            const a = workspace.document.createElement('a');
            a.classList.add('web-link', 'ref-link', 'dy-tooltip');
            a.setAttribute('data-link', link);
            a.setAttribute('data-tip', title);
            a.style.display = 'inline';
            a.href = 'javascript:void(0)';

            workspace.scopeManager.push('wrapper:zreflink', a);
        }
    },
    endMilestone: {
        stage: 'standard',
        details: ({ context }) => ({
            link: getElement(context).atts['link']?.[0],
            title: getElement(context).atts['title']?.[0]
        }),
        guard: ({ context, workspace }) =>
            matchElement(context, 'usfm:zreflink') && renderIfRegularOrIfHackedIntro(workspace),
        action: ({ workspace }) => {
            terminatePhrase(workspace);
            workspace.scopeManager.promoteContent('wrapper:zreflink');
        }
    },
    text: {
        stage: 'standard',
        details: ({ workspace }) => workspace.scratch.text?.cleanedText,
        guard: ({ workspace }) =>
            !workspace.scratch.text?.empty && isTopWrapper(workspace, 'wrapper:zreflink'),
        action({ workspace }) {
            addPhrases(workspace, workspace.scratch.text!.cleanedText!, {
                requireTop: true,
                newPhrase: false
            });
        }
    },
    endDocument: {
        stage: 'standard',
        details: ({ workspace }) => ({
            count: workspace.root.querySelectorAll('a.web-link.ref-link').length
        }),
        action({ workspace }) {
            workspace.root.querySelectorAll('a.web-link.ref-link').forEach((el) => {
                el.addEventListener('click', function clickRefLink(event) {
                    event.stopPropagation();
                    event.preventDefault();
                    const [docSet, book, chapter, verse] = splitString(
                        el.getAttribute('data-link') ?? '',
                        '.'
                    );
                    const refBc = workspace.config.bookCollections?.find((x) => x.id === docSet);
                    if (refBc) {
                        workspace.events.navigate({
                            docSet: refBc.languageCode + '_' + refBc.id,
                            book,
                            chapter,
                            verse
                        });
                    }
                });
            });
        }
    }
});

export const inlineReferences = new FeatureSpec<SharedTextScratch>('Inline References', {
    startWrapper: {
        stage: 'standard',
        details: ({ context }) => ({ class: extractClassName(getElement(context)) }),
        guard: ({ context, workspace }) =>
            matchElement(context, 'usfm:rq') && renderIfRegularOrIfHackedIntro(workspace),
        action: ({ workspace }) => {
            const spanElement = workspace.document.createElement('span');
            spanElement.classList.add('rq');
            workspace.scopeManager.push('wrapper:rq', spanElement);
        }
    },
    endWrapper: {
        stage: 'standard',
        details: ({ context }) => ({ class: extractClassName(getElement(context)) }),
        guard: ({ context, workspace }) =>
            matchElement(context, 'usfm:rq') && renderIfRegularOrIfHackedIntro(workspace),
        action: ({ workspace }) => {
            terminatePhrase(workspace);

            workspace.scopeManager.promoteContent('wrapper:rq');
        }
    },
    text: {
        stage: 'standard',
        details: ({ workspace }) => workspace.scratch.text?.cleanedText,
        guard: ({ workspace }) =>
            !workspace.scratch.text?.empty &&
            workspace.scopeManager.has('wrapper:rq') &&
            renderIfRegularOrIfHackedIntro(workspace),
        action({ workspace }) {
            const span = workspace.scopeManager.find('wrapper:rq')!.root;
            span.innerHTML += generateReferenceLinkHTML(
                workspace.scratch.text!.cleanedText!,
                'inline_ref-link'
            );
        }
    },
    endDocument: {
        stage: 'standard',
        action({ workspace }) {
            workspace.root.querySelectorAll('a.inline_ref-link').forEach((el) => {
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
