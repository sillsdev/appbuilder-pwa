import type { Block } from 'proskomma-json-tools';

// TODO: What is the point of caching this? It isn't used anywhere else as far as I can tell... -Aidan
export type BlockGraftScratch = { blockGraft?: { currentSequence?: Block['sequence'] } };
