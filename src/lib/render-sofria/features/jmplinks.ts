import { FeatureSpec } from '$lib/render-sofria/common';
import { getElement, matchElement } from './common';
import { addPhrases } from './common/text';

export const jmplinks = new FeatureSpec(
    [
        {
            event: 'startWrapper',
            stage: 'standard',
            guard: ({ context }) => matchElement(context, 'usfm:jmp'),
            action: ({ context, workspace }) => {
                const element = getElement(context);

                let jmpLink: HTMLElement;

                let href = element.atts['href']?.[0] ?? '';
                try {
                    href = decodeURIComponent(href);
                } catch {
                    // empty
                }
                if (href) {
                    const hrefLower = href.trim().toLowerCase();
                    const allowed =
                        hrefLower.startsWith('http://') ||
                        hrefLower.startsWith('https://') ||
                        hrefLower.startsWith('mailto:') ||
                        hrefLower.startsWith('tel:');
                    if (!allowed) {
                        console.warn('Ignoring unsupported jmp href protocol:', href);
                        href = '';
                        jmpLink = workspace.document.createElement('span');
                    } else {
                        jmpLink = workspace.document.createElement('a');
                        const className = hrefLower.startsWith('mailto:')
                            ? 'email-link'
                            : hrefLower.startsWith('tel:')
                              ? 'tel-link'
                              : 'web-link';
                        jmpLink.classList.add(className);
                        jmpLink.setAttribute('href', hrefLower);
                        if (className === 'web-link') {
                            jmpLink.setAttribute('target', '_blank');
                            jmpLink.setAttribute('rel', 'noopener noreferrer');
                        }
                        jmpLink.addEventListener('click', (e) => e.stopPropagation());
                    }
                } else {
                    jmpLink = workspace.document.createElement('span');
                }

                let jmpTitle = element.atts['title']?.[0] ?? '';
                try {
                    jmpTitle = decodeURIComponent(jmpTitle);
                } catch {
                    // empty
                }

                jmpLink.style.display = 'inline';
                jmpLink.classList.add('dy-tooltip');
                jmpLink.setAttribute('data-tip', jmpTitle);

                workspace.scopeManager.push('wrapper:jmp', jmpLink);
            }
        },
        {
            event: 'endWrapper',
            stage: 'standard',
            guard: ({ context }) => matchElement(context, 'usfm:jmp'),
            action: ({ workspace }) => {
                workspace.scopeManager.promoteContent('wrapper:jmp');
            }
        },
        {
            event: 'text',
            stage: 'standard',
            details: ({ workspace }) => workspace.scratch.text?.cleanedText,
            guard: ({ workspace }) =>
                !workspace.scratch.text?.empty && !!workspace.scopeManager.find('wrapper:jmp'),
            action({ workspace }) {
                addPhrases(workspace, workspace.scratch.text!.cleanedText!, {
                    requireTop: true,
                    newPhrase: false
                });
            }
        }
    ],
    'JMP Links'
);
