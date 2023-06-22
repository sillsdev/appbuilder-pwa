import { groupStore, referenceStore } from './store-types';
import { writable, get } from 'svelte/store';
import { setDefaultStorage } from './storage';
import config from '../config';

const initReference: App.CollectionGroup = {
  singlePane: {
    id: '', 
    name: '', 
    singlePane: false,
    description: ''
  }, 
  sideBySide: [
    {
      id: '', 
      name: '', 
      singlePane: false,
      description: ''
    },
    {
      id: '', 
      name: '', 
      singlePane: false,
      description: ''
    }
  ], 
  verseByVerse: [
    {
      id: '', 
      name: '', 
      singlePane: false,
      description: ''
    },
    {
      id: '', 
      name: '', 
      singlePane: false,
      description: ''
    },    {
      id: '', 
      name: '', 
      singlePane: false,
      description: ''
    }
  ]
};
setDefaultStorage('docSets', initReference);
export const docSet = groupStore(referenceStore, localStorage.docSets);

function createNextDocSet() {
  const external = writable<App.CollectionGroup>(initReference);

  return {
      subscribe: external.subscribe,
      set: external.set,
      reset: () => {
          external.set(initReference);
      }
  };
}
export const nextDocSet = createNextDocSet();