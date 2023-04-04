import { writable } from "svelte/store";

/* list of bookmarks */
export const bookmarks = writable([]);

bookmarks.subscribe(value => {
    localStorage.bookmarks = JSON.stringify(value);
    //console.log("Bookmarks", value);
});

export const highlights = writable([]);

highlights.subscribe(value => {
    localStorage.notes = JSON.stringify(value);
    //console.log("Highlights", value);
})

export const notes = writable([]);

notes.subscribe(value => {
    localStorage.notes = JSON.stringify(value);
    //console.log("Notes", value);
})