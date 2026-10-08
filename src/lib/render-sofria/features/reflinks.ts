import { FeatureSpec, renderIfRegularOrIfHackedIntro } from '$lib/render-sofria/common';
import { splitString } from '$lib/scripts/stringUtils';
import { getElement, matchElement } from './common';
import { type SharedTextScratch } from './common/text';

export const reflinks = new FeatureSpec<SharedTextScratch>(
    [
        {
            event: 'startMilestone',
            stage: 'standard',
            details: ({ context }) => ({
                link: getElement(context).atts['link']?.[0],
                title: getElement(context).atts['title']?.[0]
            }),
            guard: ({ context, workspace }) =>
                matchElement(context, 'usfm:zreflink') && renderIfRegularOrIfHackedIntro(workspace),
            action: ({ context, workspace }) => {
                const element = getElement(context);
                const link = decodeURIComponent(element.atts['link'][0]);
                const title = decodeURIComponent(element.atts['title']?.[0] ?? '');

                const a = workspace.document.createElement('a');
                a.classList.add('web-link', 'ref-link', 'dy-tooltip');
                a.setAttribute('data-link', link);
                a.setAttribute('data-tip', title);
                a.style.display = 'inline';
                a.href = 'javascript:void(0)';

                workspace.scopeManager.push('milestone:zreflink', a);
            }
        },
        {
            event: 'endMilestone',
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
        {
            event: 'endDocument',
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
                        const refBc = workspace.config.bookCollections?.find(
                            (x) => x.id === docSet
                        );
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
    ],
    'Reference Links'
);
