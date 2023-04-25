import { writable, get } from "svelte/store";

function createHistory() {
  const { subscribe, set, update } = writable([]);
  let nextItem = { collection: '', book: '', chapter: '', verse: ''};
  let nextTimer = null;

  const addNextItem = () => {
    console.log("addNextItem:", nextItem);
    update((items) => [...items, nextItem]);
    nextItem = { collection: '', book: '', chapter: '', verse: ''};
  }
  const setNextItem = (item) => {
    console.log("setNextItem:", item);
    if (nextTimer) {
        clearInterval();
        nextTimer =  null;
    }
    nextItem = item;
    nextTimer = setInterval(addNextItem, 2000);
  }
  return {
    subscribe,
    set,
    update,
    add: (item) => setNextItem({...item, date: new Date()[Symbol.toPrimitive]('number')}), 
    clear: () => set([]),
  };
}

export const history = createHistory();