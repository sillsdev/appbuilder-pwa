import { writable, derived, get } from 'svelte/store';
import { catalog } from './catalog';
import config from './config';

/**stores references and some useful derived information.*/
export const referenceStore = (initReference) => {
    const internal = writable({ ds: '', b: '', c: '', n: 0 });
    /**sets internal state based on info available in catalog*/
    const setInternal = ({ docSet, book, chapter }) => {
        const original = get(internal);
        const docSets = catalog.map((ds) => ds.id);
        if (!docSet || !docSets.includes(docSet))
            docSet = docSets.includes(original.ds) ? original.ds : docSets[0];

        const books = catalog.find((ds) => docSet === ds.id).documents.map((b) => b.bookCode);
        if (!book || !books.includes(book))
            book = books.includes(original.b) ? original.b : books[0];

        const versesByChapters = catalog
            .find((ds) => docSet === ds.id)
            .documents.find((b) => book === b.bookCode).versesByChapters;
        if (!chapter || (!Object.keys(versesByChapters).includes(chapter) && chapter != 'i'))
            chapter = Object.keys(versesByChapters).includes(original.c) ? original.c : '1';

        let length = 1;
        if (chapter != 'i') {
            length = Object.keys(versesByChapters[chapter]).length;
        }
        internal.set({
            ds: docSet,
            b: book,
            c: chapter,
            n: length
        });
    };
    function parseReference(ref) {
        if (!ref) return ['','',''];
        const parts = ref.split('.');
        if (parts.length === 2) {
            // After everyone has converted to full references, remove this check
            const defaultDocSet = config.bookCollections[0].languageCode + "_" + config.bookCollections[0].id;
            return [defaultDocSet, ...parts];
        }
        return parts;
    }
    const [docSetInit, bookInit, chapterInit] = parseReference(initReference);
    setInternal({ docSet: docSetInit, book: bookInit, chapter: chapterInit });

    const external = derived(internal, ($internal) => ({
        reference: `${$internal.b} ${$internal.c}${$internal.n ? '' : ':' + $internal.n}`,
        docSet: $internal.ds,
        collection: $internal.ds.split('_')[1],
        book: $internal.b,
        chapter: $internal.c,
        chapterVerses: `${$internal.c}:1-${$internal.n}`,
        numVerses: $internal.n,
        hasAudio:config.traits['has-audio'] && config.bookCollections
        .find((x) => x.id === $internal.ds.split('_')[1]).books
        .find((x) => x.id === $internal.b).audio
        .find((x) => x.num == $internal.c),


        title: catalog.find((ds) => ds.id === $internal.ds)
            .documents.find((b) => b.bookCode === $internal.b).toc,
        name: catalog.find((ds) => ds.id === $internal.ds)
            .documents.find((b) => b.bookCode === $internal.b).h,
        next: (() => {
            let nextBook = null;
            let nextChapter = null;
            const books = catalog.find((ds) => ds.id === $internal.ds).documents;
            const codes = books.map((b) => b.bookCode);
            const i = codes.indexOf($internal.b);
            const chapters = Object.keys(books[i].versesByChapters);
            const j = chapters.indexOf($internal.c);
            if (j + 1 >= chapters.length) {
                if (i + 1 < codes.length) {
                    nextBook = codes[i + 1];
                    nextChapter = Object.keys(books[i + 1].versesByChapters)[0];
                }
            } else {
                nextChapter = chapters[j + 1];
                nextBook = codes[i];
            }
            return { book: nextBook, chapter: nextChapter };
        })(),
        prev: (() => {
            let prevBook = null;
            let prevChapter = null;
            const books = catalog.find((ds) => ds.id === $internal.ds).documents;
            const codes = books.map((b) => b.bookCode);
            const i = codes.indexOf($internal.b);
            const chapters = Object.keys(books[i].versesByChapters);
            const j = chapters.indexOf($internal.c);
            if (j <= 0) {
                if (i - 1 >= 0) {
                    prevBook = codes[i - 1];
                    const c2 = Object.keys(books[i - 1].versesByChapters);
                    prevChapter = c2[c2.length - 1];
                }
            } else {
                prevChapter = chapters[j - 1];
                prevBook = codes[i];
            }
            return { book: prevBook, chapter: prevChapter };
        })()
    }));

    const skip = ((direction) => {
        const ref = get(external);
        console.log("PREV:", ref.prev);
        console.log("NEXT:", ref.next);
        const switchTo = direction < 0 ? ref.prev : ref.next;
        console.log(`SKIP: direction=${direction}, switchTo=`,switchTo);
        // if the chapter exists, the book will too, so only need to check chapter
        if (switchTo.chapter) {
            setInternal({book: switchTo.book, chapter: switchTo.chapter});
            return true;
        }
        return false;
    });
    return { subscribe: external.subscribe, set: setInternal, skip };
};

/**
 * a store wrapper for a dynamic list of stores.
 * behaves like a normal store if the default key is used.
 */
export const groupStore = (/**@type{any}*/ groupType, /**@type{any}*/ props) => {
    /**@type{any}*/ const stores = { default: groupType(props) };
    /**@type{any}*/ const vals = { default: undefined };
    /**@type{any}*/ const mods = { default: undefined };
    /**@type{any}*/ const unsubs = {
        default: stores.default.subscribe((v) => (vals['default'] = v))
    };
    /**@type{any}*/ const subs = { default: []};

    const subscribe = (cb, key = 'default') => {
        if(!stores.hasOwnProperty(key)) {
            stores[key] = groupType(props);
            unsubs[key] = stores[key].subscribe((v) => (vals[key] = v));
            subs[key] = [];
        }
        subs[key].push(cb);
        cb(vals[key], mods[key]);
        return () => {
            subs[key] = subs[key].filter((sub) => sub !== cb);
            if(key !== 'default' && subs[key].length <= 0) {
                unsubs[key]();
                delete stores[key];
                delete vals[key];
                delete mods[key];
                delete unsubs[key];
                delete subs[key];
            }
        }
    };

    const set = (val, key = 'default', mod = undefined) => {
        stores[key].set(val);
        mods[key] = mod;
        subs[key].forEach((sub) => sub(vals[key], mods[key]));
    };

    const extras = Object.fromEntries(Object.entries(stores["default"]).filter((kv) => kv[0] !== "subscribe" && kv[0] !== "set" && typeof(kv[1]) === 'function').map((kv) => [
        kv[0], 
        (val, key = 'default', mod = undefined) => {
            stores[key][kv[0]](val);
            mods[key] = mod;
            subs[key].forEach((sub) => sub(vals[key], mods[key]));
        }
    ]));

    return {subscribe, set, ...extras};
};
