import { FeatureSpec, renderIfRegularOrIfHackedIntro } from '$lib/render-sofria/common';
import { splitString } from '$lib/scripts/stringUtils';
import { getElement, matchElement } from './common';
import { addPhrases, type SharedTextScratch } from './common/text';

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

            workspace.scopeManager.push('milestone:zreflink', a);
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
            workspace.scopeManager.promoteContent('milestone:zreflink');
        }
    },
    text: {
        stage: 'standard',
        details: ({ workspace }) => workspace.scratch.text?.cleanedText,
        guard: ({ workspace }) =>
            !workspace.scratch.text?.empty && workspace.scopeManager.has('milestone:zreflink'),
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
            count: workspace.root.querySelectorAll('a.ref-link').length
        }),
        action({ workspace }) {
            workspace.root.querySelectorAll('a.ref-link').forEach((el) => {
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
