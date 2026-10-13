import { deselectAllElements } from '$lib/scripts/verseSelectUtil';
import { FeatureSpec, type RenderWorkspace } from '../common';

export const documentFeature = new FeatureSpec('Default', [
    {
        event: 'startDocument',
        stage: 'fallback',
        details: ({ workspace }) => workspace.stores.references,
        action({ workspace }) {
            const baseDiv = workspace.document.createElement('div');
            baseDiv.setAttribute('data-verse', 'start');
            baseDiv.setAttribute('data-phrase', 'none');
            deselectAllElements(workspace.root);
            workspace.root.appendChild(baseDiv);
            workspace.scopeManager.push('document', workspace.root);
        }
    },
    {
        event: 'endDocument',
        stage: 'standard',
        action({ workspace }) {
            addFooter(workspace);

            workspace.root.querySelectorAll('.seltxt').forEach((el) => {
                el.addEventListener('click', (e) => workspace.events.clickText(e as MouseEvent));
            });
        }
    },
    {
        event: 'endDocument',
        stage: 'cleanup',
        details: ({ workspace }) => workspace.stores.references,
        action({ workspace, output }) {
            workspace.scopeManager.pop('document');
            output.root = workspace.root;
        }
    }
]);

function addFooter(workspace: RenderWorkspace) {
    const collection = workspace.stores.references.docSet.split('_')[1];
    let footer = workspace.config.bookCollections?.find((x) => x.id === collection)?.footer;
    const bookFooter = workspace.config.bookCollections
        ?.find((x) => x.id === collection)
        ?.books.find((x) => x.id === workspace.stores.references.book)?.footer;
    if (bookFooter) {
        footer = bookFooter;
    }

    if (footer && workspace.root.getElementsByClassName('footer').length == 0) {
        const divFooter = workspace.document.createElement('div');
        divFooter.classList.add('footer');
        divFooter.classList.add('md:footer-horizontal');
        const divFooterLine = workspace.document.createElement('div');
        divFooterLine.classList.add('footer-line');
        divFooter.appendChild(divFooterLine);
        const spanFooter = workspace.document.createElement('span');
        spanFooter.classList.add('footer');
        spanFooter.classList.add('md:footer-horizontal');
        spanFooter.innerHTML = footer;
        divFooterLine.appendChild(spanFooter);
        workspace.root.appendChild(divFooter);
    }
}
