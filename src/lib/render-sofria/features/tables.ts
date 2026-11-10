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
            workspace.scopeManager.push('table', table);
            addToScratchPad(workspace.scratch, 'table', { rowIndex: 0 });
        }
    },
    endTable: {
        stage: 'fallback',
        details: () => undefined,
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action: ({ workspace }) => {
            workspace.scopeManager.promoteContent('table');
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
            workspace.scopeManager.promoteContent('wrapper:cell');
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
