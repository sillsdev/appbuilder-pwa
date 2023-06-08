import { writable, get } from "svelte/store";
import { setDefaultStorage } from "./storage";
import { refs } from "./scripture";
import { findBookmarkByChapter } from "$lib/data/bookmarks";
import { findHighlightByChapter } from "$lib/data/highlights";
import { findNoteByChapter } from "$lib/data/notes";

/* list of bookmarks */
function createBookmarks() {
    const {subscribe, set} = writable([]);
    const fetchData = async (item) => {
        const foundBookmarks = await findBookmarkByChapter(item);
        set(foundBookmarks);
    };

    refs.subscribe(item => {
        fetchData(item);
    });
    
    return {
        subscribe, 
        sync: async () => await fetchData(get(refs))
    };
}
export const bookmarks = createBookmarks();

function createHighlights() {
    const {subscribe, set} = writable([]);
    const fetchData = async (item) => {
        const foundHighlights = await findHighlightByChapter(item);
        set(foundHighlights);
    };

    refs.subscribe(item => {
        fetchData(item);
    });
    
    return {
        subscribe, 
        sync: async () => await fetchData(get(refs))
    };
}
export const highlights = createHighlights();

function createNotes() {
    const {subscribe, set} = writable([]);
    const fetchData = async (item) => {
        const foundNotes = await findNoteByChapter(item);
        set(foundNotes);
    };

    refs.subscribe(item => {
        fetchData(item);
    });
    
    return {
        subscribe, 
        sync: async () => await fetchData(get(refs))
    };
}
export const notes = createNotes();