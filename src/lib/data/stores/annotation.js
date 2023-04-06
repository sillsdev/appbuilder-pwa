import { writable } from "svelte/store";
import { setDefaultStorage } from "./storage";

/* list of bookmarks */
setDefaultStorage('bookmarks', '[]');
export const bookmarks = writable(JSON.parse(localStorage.bookmarks));
bookmarks.subscribe(value => {
    localStorage.bookmarks = JSON.stringify(value);
    //console.log("Bookmarks", value);
});

setDefaultStorage('highlights', '[]');
export const highlights = writable(JSON.parse(localStorage.highlights));
highlights.subscribe(value => {
    localStorage.notes = JSON.stringify(value);
    //console.log("Highlights", value);
})

setDefaultStorage('notes', '[]');
export const notes = writable(JSON.parse(localStorage.notes));
notes.subscribe(value => {
    localStorage.notes = JSON.stringify(value);
    //console.log("Notes", value);
})