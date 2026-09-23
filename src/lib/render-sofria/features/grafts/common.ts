import {
    addToScratchPad,
    type RenderEnvironment,
    type RenderWorkspace
} from '$lib/render-sofria/common';
import type { Block } from 'proskomma-json-tools';

// TODO: What is the point of caching this? It isn't used anywhere else as far as I can tell... -Aidan
export type BlockGraftScratch = { blockGraft?: { currentSequence?: Block['sequence'] } };

export function renderGraftedSequence(
    env: RenderEnvironment<BlockGraftScratch>,
    currentSequence: Block['sequence']
) {
    const cachedSequencePointer = env.workspace.scratch.blockGraft?.currentSequence;
    addToScratchPad(env.workspace.scratch, 'blockGraft', {
        currentSequence
    });
    env.context.renderer.renderSequence(env);
    addToScratchPad(env.workspace.scratch, 'blockGraft', {
        currentSequence: cachedSequencePointer
    });
}
