import type { RenderContext } from 'proskomma-json-tools';
import { addToScratchPad, FeatureSpec } from '../common';

export function isCellWrapper(context: RenderContext) {
    return context.sequences[0].element.subType === 'cell';
}

export const tables = new FeatureSpec<{ table: { colIndex?: number } }>([
    {
        eventTriggers: ['startRow'],
        action: ({ context, workspace }) => {
            if (workspace.logSettings.row) {
                console.log('Start Row %o', context.sequences[0].element);
            }
            let tableElement = workspace.scopeManager.getActiveContentRoot('table');
            if (!tableElement) {
                tableElement = workspace.document.createElement('table');
                tableElement.setAttribute('cellpadding', '5');
                workspace.scopeManager.addScope('table', tableElement);
            }
            workspace.scopeManager.addScope('row', workspace.document.createElement('tr'));
            addToScratchPad(workspace.scratch, 'table', { colIndex: 0 });
        }
    },
    {
        eventTriggers: ['endRow'],
        action: ({ context, workspace }) => {
            if (workspace.logSettings.row) {
                console.log('End Row %o', context.sequences[0].element);
            }
            workspace.scopeManager.promoteContent();
        }
    },
    {
        eventTriggers: ['startWrapper'],
        guard: ({ context }) => isCellWrapper(context),
        action: ({ context, workspace }) => {
            if (workspace.logSettings.wrapper) {
                console.log('Start Wrapper %o', context.sequences[0].element);
            }

            const colIndex = (workspace.scratch.table.colIndex ?? 0) + 1;
            addToScratchPad(workspace.scratch, 'table', { colIndex });
            const tableCellElement = workspace.document.createElement('td');
            tableCellElement.classList.add(`tc${colIndex}`);

            workspace.scopeManager.addScope('cell', tableCellElement);
        }
    },
    {
        eventTriggers: ['endWrapper'],
        guard: ({ context }) => isCellWrapper(context),
        action: ({ context, workspace }) => {
            if (workspace.logSettings.wrapper) {
                console.log('End Wrapper %o', context.sequences[0].element);
            }
            workspace.scopeManager.promoteContent();
        }
    }
]);
