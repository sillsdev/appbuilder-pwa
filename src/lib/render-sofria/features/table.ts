import type { RenderContext } from 'proskomma-json-tools';
import { addToScratchPad, FeatureSpec } from '../common';

export function isCellWrapper(context: RenderContext) {
    return context.sequences[0].element.subType === 'cell';
}

export const tables = new FeatureSpec<{ table?: { colIndex?: number } }>([
    {
        event: 'startTable',
        stage: 'fallback',
        action: ({ context, workspace }) => {
            const table = workspace.document.createElement('table');
            table.setAttribute('cellpadding', '5');
            workspace.scopeManager.push('table', table);
        }
    },
    {
        event: 'endTable',
        stage: 'fallback',
        action: ({ context, workspace }) => {
            workspace.scopeManager.promoteContent('table');
        }
    },
    {
        event: 'startRow',
        stage: 'fallback',
        action: ({ context, workspace }) => {
            workspace.scopeManager.push('row', workspace.document.createElement('tr'));
            addToScratchPad(workspace.scratch, 'table', { colIndex: 0 });
        }
    },
    {
        event: 'endRow',
        stage: 'fallback',
        action: ({ context, workspace }) => {
            workspace.scopeManager.promoteContent('row');
        }
    },
    {
        event: 'startWrapper',
        stage: 'standard',
        guard: ({ context }) => isCellWrapper(context),
        action: ({ context, workspace }) => {
            const nCols = Number(context.sequences[0].element.atts['nCols']);

            const colIndex = (workspace.scratch.table?.colIndex ?? 0) + nCols;
            addToScratchPad(workspace.scratch, 'table', { colIndex });
            const td = workspace.document.createElement('td');
            td.classList.add(`tc${colIndex}`);
            td.colSpan = nCols;

            workspace.scopeManager.push('wrapper:cell', td);
        }
    },
    {
        event: 'endWrapper',
        stage: 'standard',
        guard: ({ context }) => isCellWrapper(context),
        action: ({ workspace }) => {
            workspace.scopeManager.promoteContent('wrapper:cell');
        }
    }
]);
