import { writable, get } from "svelte/store";
import { setDefaultStorage } from "./storage";

function createHistory() {
  setDefaultStorage('history', "[]");
  const { subscribe, set, update } = writable(JSON.parse(localStorage.history));
  let nextItem = { collection: '', book: '', chapter: '', verse: ''};
  let nextTimer = null;

  const addNextItem = () => {
    clearInterval(nextTimer);
    nextTimer = null;
    console.log("addNextItem:", nextItem);
    update((items) => [nextItem, ...items]);
    nextItem = { collection: '', book: '', chapter: '', verse: ''};
  }
  const setNextItem = (item) => {
    console.log("setNextItem:", item);
    if (nextTimer) {
        clearInterval(nextTimer);
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
history.subscribe(value => localStorage.history = JSON.stringify(value));