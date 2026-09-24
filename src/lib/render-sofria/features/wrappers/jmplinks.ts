import { addToScratchPad, FeatureSpec } from '$lib/render-sofria/common';
import { usfmType } from './common';

export function isJmplinkWrapper(usfmType: string) {
    return usfmType === 'jmp';
}

export const jmplinks = new FeatureSpec<{ wrapper?: { jmpTitle?: string } }>([
    {
        event: 'startWrapper',
        guard: ({ context }) => isJmplinkWrapper(usfmType(context)),
        action: ({ context, workspace }) => {
            const element = context.sequences[0].element;
            if (workspace.logSettings.wrapper) {
                console.log('Start Wrapper %o', element);
            }

            let jmpLink: HTMLElement;

            workspace.textType.push('jmp');
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
        guard: ({ context }) => isJmplinkWrapper(usfmType(context)),
        action: ({ context, workspace }) => {
            if (workspace.logSettings.wrapper) {
                console.log('End Wrapper %o', context.sequences[0].element);
            }
            workspace.textType.pop();
            workspace.scopeManager.promoteContent('wrapper:jmp');

            // TODO add link behavior
        }
    }
]);
