import { FeatureSpec, noaction, renderIfRegularOrIfHackedIntro } from '$lib/render-sofria/common';
import { getElement, matchElement } from './common';
import { addPhrases, isTopWrapper, terminatePhrase, type SharedTextScratch } from './common/text';

export const paragraphStyles = new FeatureSpec('Paragraph Styles', {
    startMilestone: {
        stage: 'standard',
        details: ({ context }) => ({ styles: getElement(context).atts['id'] }),
        guard: ({ context, workspace }) =>
            matchElement(context, 'usfm:zstyle') && renderIfRegularOrIfHackedIntro(workspace),
        action: ({ context, workspace }) => {
            const styles = getElement(context).atts['id'] as unknown as string[];
            const para = workspace.scopeManager.find('paragraph')?.root;
            if (para) {
                para.classList.add(...styles);
            }
        }
    },
    endMilestone: {
        stage: 'standard',
        details: ({ context }) => ({ styles: getElement(context).atts['id'] }),
        guard: ({ context, workspace }) =>
            matchElement(context, 'usfm:zstyle') && renderIfRegularOrIfHackedIntro(workspace),
        action: noaction
    }
});

export const characterStyles = new FeatureSpec<SharedTextScratch>('Character Styles', {
    startMilestone: {
        stage: 'standard',
        details: ({ context }) => ({ styles: getElement(context).atts['id'] }),
        guard: ({ context, workspace }) =>
            matchElement(context, 'usfm:zcstyle') && renderIfRegularOrIfHackedIntro(workspace),
        action: ({ context, workspace }) => {
            const styles = getElement(context).atts['id'] as unknown as string[];
            const span = workspace.document.createElement('span');
            span.classList.add(...styles);
            workspace.scopeManager.push('wrapper:zcstyle', span);
        }
    },
    endMilestone: {
        stage: 'standard',
        details: ({ context }) => ({ styles: getElement(context).atts['id'] }),
        guard: ({ context, workspace }) =>
            matchElement(context, 'usfm:zcstyle') && renderIfRegularOrIfHackedIntro(workspace),
        action: ({ workspace }) => {
            terminatePhrase(workspace);
            workspace.scopeManager.promoteContent('wrapper:zcstyle');
        }
    },
    text: {
        stage: 'standard',
        details: ({ workspace }) => workspace.scratch.text?.cleanedText,
        guard: ({ workspace }) =>
            !workspace.scratch.text?.empty && isTopWrapper(workspace, 'wrapper:zcstyle'),
        action({ workspace }) {
            addPhrases(workspace, workspace.scratch.text!.cleanedText!, {
                requireTop: true
            });
        }
    }
});
