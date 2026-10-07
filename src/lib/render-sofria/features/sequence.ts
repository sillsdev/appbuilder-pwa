import { FeatureSpec, renderIfRegularOrIfHackedIntro, type RenderEnvironment } from '../common';
import { matchSequence } from './common';

export const sequences = new FeatureSpec([
    {
        event: 'startSequence',
        stage: 'fallback',
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ context, workspace }) {
            if (matchSequence(context, 'title')) {
                const div = document.createElement('div');
                div.setAttribute('data-verse', 'title');
                div.setAttribute('data-phrase', 'none');
                div.classList.add('scroll-item');
                workspace.scopeManager.push('sequence:title', div);
            }
        }
    },
    {
        event: 'endSequence',
        stage: 'fallback',
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action: ({ context, workspace }) => {
            if (matchSequence(context, 'title')) {
                const div = workspace.scopeManager.find('sequence:title')?.root;
                if (div) {
                    div.innerHTML += `<div class="b"></div><div class="b"></div>`;
                }
                workspace.scopeManager.promoteContent('sequence:title');
            }
        }
    }
]);
