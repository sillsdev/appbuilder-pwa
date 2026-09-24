import { FeatureSpec, renderIfRegularOrIfHackedIntro, type RenderEnvironment } from '../common';

export const sequences = new FeatureSpec([
    {
        event: 'startSequence',
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ context, workspace }) {
            const sequenceType = context.sequences[0].type;
            if (workspace.logSettings.sequence) {
                console.log('Start sequence |%o|', sequenceType);
            }
            switch (sequenceType) {
                case 'title': {
                    workspace.textType.push('title');
                    const div = document.createElement('div');
                    div.setAttribute('data-verse', 'title');
                    div.setAttribute('data-phrase', 'none');
                    div.classList.add('scroll-item');
                    workspace.scopeManager.addScope('sequence:title', div);
                    break;
                }
                case 'heading':
                case 'main':
                case 'introduction':
                case 'fig':
                case 'footnote':
                case 'xref': {
                    workspace.textType.push(sequenceType);
                    break;
                }
                default: {
                    break;
                }
            }
        }
    },
    {
        event: 'endSequence',
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action: ({ context, workspace }) => {
            const sequenceType = context.sequences[0].type;
            if (workspace.logSettings.sequence) {
                console.log('End sequence |%o|', sequenceType);
            }

            switch (sequenceType) {
                case 'title': {
                    workspace.textType.pop();
                    const div = workspace.scopeManager.getScope('sequence:title')?.contentRoot;
                    if (div) {
                        div.innerHTML += `<div class="b"></div><div class="b"></div>`;
                        if (workspace.logSettings.sequence) {
                            console.log('TITLE DIV %o', div);
                        }
                    }
                    workspace.scopeManager.promoteContent('sequence:title');
                    break;
                }
                case 'heading':
                case 'main':
                case 'introduction':
                case 'fig':
                case 'footnote':
                case 'xref': {
                    workspace.textType.pop();
                    break;
                }
                default: {
                    break;
                }
            }
        }
    }
]);
