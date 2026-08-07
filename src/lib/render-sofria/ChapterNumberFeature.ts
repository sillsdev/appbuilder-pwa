import { scriptureConfig } from '$assets/config';
import { getFeatureValueString } from '$lib/scripts/configUtils';
import * as numerals from '$lib/scripts/numeralSystem';
import { FeatureSpec, RenderScopeLevel, type RenderEnvironment } from './common';

const chapterNumberFeature = new FeatureSpec(
    [
        {
            eventTriggers: ['mark'],
            action({ context, workspace }: RenderEnvironment) {
                const element = context.sequences[0].element;

                if (workspace.logSettings.mark) {
                    console.log('Mark: SubType %o, Atts: %o', element.subType, element.atts);
                }
                console.warn('Mark: SubType %o, Atts: %o', element.subType, element.atts);

                if (element.subType === 'chapter_label') {
                    const chapterNumText = numerals.formatNumber(
                        workspace.numeralSystem,
                        element.atts['number']
                    );
                    const chapterNumDiv = workspace.document.createElement('div');
                    chapterNumDiv.innerText = chapterNumText;

                    const format = getFeatureValueString(
                        scriptureConfig,
                        'chapter-number-format',
                        workspace.references.collection,
                        workspace.references.book
                    );
                    if (format === 'drop-cap') {
                        chapterNumDiv.classList.add('c-drop');

                        const direction = scriptureConfig.bookCollections?.find(
                            (x) => x.id === workspace.references.collection
                        )?.style?.textDirection;
                        chapterNumDiv.style.float =
                            direction.toLowerCase() === 'ltr' ? 'left' : 'right';

                        const currentParagraph = workspace.scopeManager.getActiveContentRoot(
                            RenderScopeLevel.paragraph
                        );
                        currentParagraph.className = 'm';
                        currentParagraph.appendChild(chapterNumDiv);
                    } else {
                        chapterNumDiv.classList.add('c');
                        workspace.scopeManager.appendInnerContent(
                            chapterNumDiv,
                            RenderScopeLevel.document
                        );
                    }
                }
            }
        }
    ],
    { tag: 'show-chapter-numbers', enabledValue: 'true' }
);

export default chapterNumberFeature;
