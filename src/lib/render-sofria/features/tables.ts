import { addToScratchPad, FeatureSpec, renderIfRegularOrIfHackedIntro } from '../common';
import { getElement, matchElement } from './common';
import { addPhrases, isTopWrapper, terminatePhrase, type SharedTextScratch } from './common/text';

export const tables = new FeatureSpec<
    { table?: { colIndex?: number; rowIndex?: number } } & SharedTextScratch
>('Tables', {
    startTable: {
        stage: 'fallback',
        details: () => undefined,
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action: ({ workspace }) => {
            const table = workspace.document.createElement('table');
            table.setAttribute('cellpadding', '5');
            table.classList.add('dy-table', 'dy-table-xs', 'w-fit', 'text-start');
            workspace.scopeManager.push('table:table', table);
            workspace.scopeManager.push('table:body', workspace.document.createElement('tbody'));
            addToScratchPad(workspace.scratch, 'table', { rowIndex: 0 });
        }
    },
    endTable: {
        stage: 'fallback',
        details: () => undefined,
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action: ({ workspace }) => {
            workspace.scopeManager.promoteContent('table:body');
            workspace.scopeManager.promoteContent('table:table');
        }
    },
    startRow: {
        stage: 'fallback',
        details: ({ workspace }) => ({ row: workspace.scratch.table?.rowIndex }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action: ({ workspace }) => {
            workspace.scopeManager.push('row', workspace.document.createElement('tr'));
            const rowIndex = (workspace.scratch.table?.rowIndex ?? 0) + 1;
            addToScratchPad(workspace.scratch, 'table', {
                colIndex: 0,
                rowIndex
            });
        }
    },
    endRow: {
        stage: 'fallback',
        details: ({ workspace }) => ({
            row: workspace.scratch.table?.rowIndex
        }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action: ({ workspace }) => {
            // HACK `endRow` and `endWrapper` events arrive out of order when table has cells with column ranges
            // see: https://github.com/Proskomma/proskomma-json-tools/issues/67
            if (workspace.scopeManager.has('wrapper:cell')) {
                terminatePhrase(workspace);
                workspace.scopeManager.promoteContent('wrapper:cell');
            }

            workspace.scopeManager.promoteContent('row');
        }
    },
    startWrapper: {
        stage: 'standard',
        details: ({ context, workspace }) => ({
            cell: workspace.scratch.table?.colIndex ?? 0,
            cols: getElement(context).atts['nCols'],
            alignment: getElement(context).atts['alignment'],
            /* colHeading or body */
            role: getElement(context).atts['role']
        }),
        guard: ({ context, workspace }) =>
            matchElement(context, 'cell') && renderIfRegularOrIfHackedIntro(workspace),
        action: ({ context, workspace }) => {
            terminatePhrase(workspace);
            const element = getElement(context);
            const nCols = Number(element.atts['nCols']);
            const alignment = element.atts['alignment'];
            const heading = element.atts['role'] === 'colHeading';

            const colIndex = (workspace.scratch.table?.colIndex ?? 0) + nCols;
            addToScratchPad(workspace.scratch, 'table', { colIndex });
            const td = workspace.document.createElement(heading ? 'th' : 'td');
            td.classList.add(`${heading ? 'th' : 'tc'}${colIndex}`);
            td.colSpan = nCols;
            if (alignment === 'right') {
                td.classList.add('text-end');
            }

            // HACK see comment in `endRow`
            td.setAttribute('data-col', String(colIndex));

            workspace.scopeManager.push('wrapper:cell', td);
        }
    },
    endWrapper: {
        stage: 'standard',
        details: ({ context, workspace }) => ({
            cell: workspace.scratch.table?.colIndex ?? 0,
            cols: getElement(context).atts['nCols']
        }),
        guard: ({ context, workspace }) =>
            matchElement(context, 'cell') && renderIfRegularOrIfHackedIntro(workspace),
        action: ({ workspace }) => {
            terminatePhrase(workspace);
            // HACK see comment in `endRow`
            const cells: HTMLElement[] = [];
            while (workspace.scopeManager.has('wrapper:cell')) {
                cells.push(workspace.scopeManager.remove('wrapper:cell')!.root);
            }
            cells
                .sort(
                    (a, b) =>
                        Number(a.getAttribute('data-col')) - Number(b.getAttribute('data-col'))
                )
                .forEach((c) => workspace.scopeManager.appendContent(c));
        }
    },
    text: {
        stage: 'standard',
        details: ({ workspace }) => workspace.scratch.text?.cleanedText,
        guard: ({ workspace }) =>
            !workspace.scratch.text?.empty &&
            renderIfRegularOrIfHackedIntro(workspace) &&
            isTopWrapper(workspace, 'wrapper:cell'),
        action: ({ workspace }) => {
            terminatePhrase(workspace);
            addPhrases(workspace, workspace.scratch.text!.cleanedText!, { newPhrase: false });
        }
    }
});
