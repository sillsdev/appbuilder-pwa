import type { RenderContext } from 'proskomma-json-tools';
import { addToScratchPad, FeatureSpec } from '../common';

export function isCellWrapper(context: RenderContext) {
    return context.sequences[0].element.subType === 'cell';
}

export const tables = new FeatureSpec<{ table?: { colIndex?: number } }>([
    {
        event: 'startTable',
        default: true,
        action: ({ context, workspace }) => {
            if (workspace.logSettings.table) {
                console.log('Start Table %o', context.sequences[0].element);
            }
            const table = workspace.document.createElement('table');
            table.setAttribute('cellpadding', '5');
            workspace.scopeManager.push('table', table);
        }
    },
    {
        event: 'endTable',
        default: true,
        action: ({ context, workspace }) => {
            if (workspace.logSettings.table) {
                console.log('End Table %o', context.sequences[0].element);
            }
            workspace.scopeManager.promoteContent('table');
        }
    },
    {
        event: 'startRow',
        default: true,
        action: ({ context, workspace }) => {
            if (workspace.logSettings.row) {
                console.log('Start Row %o', context.sequences[0].element);
            }
            workspace.scopeManager.push('row', workspace.document.createElement('tr'));
            addToScratchPad(workspace.scratch, 'table', { colIndex: 0 });
        }
    },
    {
        event: 'endRow',
        default: true,
        action: ({ context, workspace }) => {
            if (workspace.logSettings.row) {
                console.log('End Row %o', context.sequences[0].element);
            }
            workspace.scopeManager.promoteContent('row');
        }
    },
    {
        event: 'startWrapper',
        guard: ({ context }) => isCellWrapper(context),
        action: ({ context, workspace }) => {
            const element = context.sequences[0].element;
            if (workspace.logSettings.wrapper) {
                console.log('Start Cell %o', element);
            }

            const nCols = Number(element.atts['nCols']);

            const colIndex = (workspace.scratch.table?.colIndex ?? 0) + nCols;
            addToScratchPad(workspace.scratch, 'table', { colIndex });
            const td = workspace.document.createElement('td');
            td.classList.add(`tc${colIndex}`);
            td.colSpan = colIndex;

            workspace.scopeManager.push('wrapper:cell', td);
        }
    },
    {
        event: 'endWrapper',
        guard: ({ context }) => isCellWrapper(context),
        action: ({ context, workspace }) => {
            if (workspace.logSettings.wrapper) {
                console.log('End Cell %o', context.sequences[0].element);
            }
            workspace.scopeManager.promoteContent('wrapper:cell');
        }
    }
]);
