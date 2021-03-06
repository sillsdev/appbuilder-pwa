import { writable, derived, get } from 'svelte/store';
import { catalog } from './catalog';

export const referenceStore = () => {
    const internal = writable({ ds: '', b: '', c: '', n: 0 });
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
        if (!chapter || !Object.keys(versesByChapters).includes(chapter))
            chapter = Object.keys(versesByChapters).includes(original.c) ? original.c : '1';

        internal.set({
            ds: docSet,
            b: book,
            c: chapter,
            n: Object.keys(versesByChapters[chapter]).length
        });
    };
    setInternal({ docSet: '', book: '', chapter: '' });
    const external = derived(internal, ($internal) => ({
        reference: `${$internal.b} ${$internal.c}${$internal.n === '' ? '' : ':' + $internal.n}`,
        docSet: $internal.ds,
        book: $internal.b,
        chapter: $internal.c,
        chapterVerses: `${$internal.c}:1-${$internal.n}`,
        numVerses: $internal.n,
        title: catalog
            .find((ds) => ds.id === $internal.ds)
            .documents.find((b) => b.bookCode === $internal.b).toc,
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
            if (j - 1 <= 0) {
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
    return { subscribe: external.subscribe, set: setInternal };
};

export const groupStore = (/**@type{any}*/ groupType, /**@type{any}*/ props) => {
    /**@type{any}*/ const stores = { default: groupType(props) };
    /**@type{any}*/ const vals = { default: undefined };
    /**@type{any}*/ const mods = { default: undefined };
    /**@type{any}*/ const unsubs = {
        default: stores.default.subscribe((v) => (vals['default'] = v))
    };
    /**@type{any[]}*/ let subs = [];
    let subGroupCounts = {};

    const subscribe = (cb) => {
        subs.push(cb);
        cb(vals, mods);
        return () => (subs = subs.filter((sub) => sub !== cb));
    };

    const set = ({ key, val, mod }) => {
        stores[key].set(val);
        mods[key] = mod;
        subs.forEach((sub) => sub(vals, mods));
    };
    const addKey = (/**@type{any}*/ key) => {
        if (key === 'default') return () => {};
        if (stores[key] === undefined) {
            stores[key] = groupType(props);
            mods[key] = undefined;
            unsubs[key] = stores[key].subscribe((v) => (vals[key] = v));
            subGroupCounts[key] = 0;
        }
        subGroupCounts[key] += 1;
        return () => {
            subGroupCounts[key] -= 1;
            if (subGroupCounts[key] <= 0) {
                unsubs[key]();
                delete unsubs[key];
                delete vals[key];
                delete mods[key];
                delete stores[key];
            }
        };
    };

    return { subscribe, set, addKey };
};
