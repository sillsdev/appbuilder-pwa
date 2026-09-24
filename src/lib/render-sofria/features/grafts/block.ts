import type { Block } from 'proskomma-json-tools';
import { addToScratchPad, FeatureSpec, type RenderEnvironment } from '../../common';
import { renderGraftedSequence, type BlockGraftScratch } from './common';

// NOTE: Are there any other block grafts besides titles and introductions??

// HACK: for proskomma, introduction will only be given as a graft on chapter 1, so we need to pass chapter 1 into proskomma
// open an issue?

export const blockGrafts = new FeatureSpec<BlockGraftScratch>([
    {
        event: 'blockGraft',
        default: true,
        action: (environment) => {
            const { context, workspace } = environment;
            if (workspace.logSettings.blockGraft) {
                console.log('Block Graft %o', context.sequences[0].block);
            }
            const currentBlock = context.sequences[0].block;
            const graftRecord: Block = {
                type: currentBlock.type,
                sequence: {}
            };

            const subType = currentBlock.subType?.toLowerCase() as Lowercase<string>;

            if (currentBlock.sequence) {
                const div = workspace.document.createElement('div');
                workspace.scopeManager.addScope(`blockGraft:${subType}`, div);

                renderGraftedSequence(environment, graftRecord.sequence);

                if (subType !== 'introduction' || workspace.hackRenderIntro) {
                    workspace.scopeManager.promoteContent(`blockGraft:${subType}`);
                } else {
                    const scope = workspace.scopeManager.removeScope(`blockGraft:${subType}`);
                    if (workspace.logSettings.blockGraft) {
                        console.log('Skipping block %o', scope);
                    }
                }
            }

            if (workspace.logSettings.blockGraft) {
                console.log('Block Graft End %o %o', graftRecord, currentBlock);
            }
        }
    }
]);
