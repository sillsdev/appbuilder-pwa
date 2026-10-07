import type { Block } from 'proskomma-json-tools';
import { FeatureSpec } from '../../common';
import { getBlock } from '../common';
import { renderGraftedSequence, type BlockGraftScratch } from './common';

// NOTE: Are there any other block grafts besides titles and introductions??

// HACK: for proskomma, introduction will only be given as a graft on chapter 1, so we need to pass chapter 1 into proskomma
// open an issue?

export const blockGrafts = new FeatureSpec<BlockGraftScratch>([
    {
        event: 'blockGraft',
        stage: 'fallback',
        action: (environment) => {
            const { context, workspace } = environment;
            const currentBlock = getBlock(context);
            const graftRecord: Block = {
                type: currentBlock.type,
                sequence: {}
            };

            const subType = currentBlock.subType;

            if (currentBlock.sequence) {
                const div = workspace.document.createElement('div');
                workspace.scopeManager.push(`blockGraft:${subType}`, div);

                renderGraftedSequence(environment, graftRecord.sequence);

                const scope = workspace.scopeManager.pop(`blockGraft:${subType}`);

                if (subType !== 'introduction' || workspace.hackRenderIntro) {
                    workspace.scopeManager.appendChildrenFromContainer(scope.root);
                } else {
                    if (workspace.logSettings.blockGraft) {
                        console.log('Skipping block %o', scope);
                    }
                }
            }
        }
    }
]);
