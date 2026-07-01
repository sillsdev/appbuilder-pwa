import { scriptureConfig } from '$assets/config';
import type { BookCollectionAudioConfig, BookCollectionConfig } from '$config';
import { isBlank, isNotBlank, isPositiveInteger } from '$lib/scripts/stringUtils';
import { loadCatalog, type CatalogData } from './catalogData';

/**
 *  Maintains the currently active scripture reference.
 */
export class NavigationContext {
    docSet: string;
    collection: string;
    reference: string;
    book: string;
    chapter: string;
    chapterLength: number;
    chapterVerses: string;
    verse: string;
    audio: BookCollectionAudioConfig | undefined;
    title: string;
    bookTab: number;
    name: string;
    catalog: CatalogData;
    allBookIds: string[];
    next: { book: string | null; chapter: string | null } = { book: null, chapter: null };
    prev: { book: string | null; chapter: string | null } = { book: null, chapter: null };
    initialized = false;

    protected fetchCatalog = loadCatalog;
    protected config = scriptureConfig;

    private docSets: string[];
    private books: string[];
    private versesByChapters: { [chapter: string]: { [verse: string]: string } };

    private docSetFromCollection(coll: Pick<BookCollectionConfig, 'id' | 'languageCode'>) {
        return `${coll.languageCode}_${coll.id}`;
    }

    private parseReference(ref: string = '') {
        const parts = ref.split('.');
        const hasCollection =
            parts.length !== 2 &&
            !(parts.length === 3 && isPositiveInteger(parts[1]) && isPositiveInteger(parts[2]));

        const docSet = hasCollection ? parts[0] : this.docSets[0];

        const collection = this.config.bookCollections?.find(
            (c) => docSet === c.id || docSet === this.docSetFromCollection(c)
        );

        const book = parts[hasCollection ? 1 : 0];

        return {
            docSet: collection ? this.docSetFromCollection(collection) : docSet,
            book: book,
            chapter: parts[hasCollection ? 2 : 1],
            verse: parts[hasCollection ? 3 : 2] || '1'
        };
    }

    private handleFallbacks(docSet: string, bookId: string, chapter: string) {
        let useFallbackDocSet = false;
        const fallbackDocSet = this.docSets[0];
        const collection =
            this.config.bookCollections?.find((c) => docSet === this.docSetFromCollection(c)) ??
            this.config.bookCollections?.find(
                (c) => fallbackDocSet === this.docSetFromCollection(c)
            );
        if (!collection || docSet !== this.docSetFromCollection(collection)) {
            console.error(
                `docSet '${docSet}' not found in collections. Defaulting to '${fallbackDocSet}'.`
            );
            useFallbackDocSet = true;
        }

        let useFallbackBookId = false;
        const fallbackBookId = collection?.books[0]?.id ?? '';
        const book = collection?.books.find((b) => b.id === bookId) ?? collection?.books[0];
        if (!book || bookId !== book.id) {
            console.error(
                `book '${bookId}' not found in '${docSet}'. Defaulting to '${fallbackBookId}'.`
            );
            useFallbackBookId = true;
        }

        let useFallbackChapter = false;
        const chapterNum = parseInt(chapter, 10);
        const chapterRange = book?.chaptersN?.split('-').map((n) => parseInt(n, 10));
        const fallbackChapter = String(chapterRange?.[0] || 1);
        if (
            (isNaN(chapterNum) && chapter !== 'i') ||
            !chapterRange ||
            chapterNum < chapterRange[0] ||
            chapterNum > (chapterRange[1] || chapterRange[0])
        ) {
            console.error(
                `chapter '${chapter}' falls outside of chapter range '${book?.chaptersN}'. Defaulting to '${fallbackChapter}'.`
            );
            useFallbackChapter = true;
        }

        return {
            docSet: useFallbackDocSet ? fallbackDocSet : docSet,
            book: useFallbackBookId ? fallbackBookId : bookId,
            chapter: useFallbackChapter ? fallbackChapter : chapter
        };
    }

    async gotoInitial(start: string = '') {
        this.docSets =
            this.config.bookCollections?.map((bc) => `${bc.languageCode}_${bc.id}`) ?? [];
        this.initialized = true;
        start = start || (this.config.mainFeatures['start-at-reference'] as string);
        // validation handled in gotoReference
        await this.gotoReference(start);
    }

    async gotoReference(reference: string) {
        const ref = this.parseReference(reference);
        await this.goto(ref.docSet, ref.book, ref.chapter, ref.verse);
    }

    async goto(docSet: string, book: string, chapter: string, verse: string = '') {
        if (!this.initialized) {
            throw new Error('NavigationContext is not initialized; please call gotoInitial()');
        }
        const withFallbacks = this.handleFallbacks(docSet, book, chapter);
        await this.updateLocation(
            withFallbacks.docSet,
            withFallbacks.book,
            withFallbacks.chapter,
            verse
        );
        this.updateAudio();
        this.updateHeadings();
        this.updateNextPrev();
        this.updateReference();
    }
    updateBookTab(bookTab: number) {
        this.bookTab = bookTab;
    }

    private async updateLocation(docSet: string, book: string, chapter: string, verse: string) {
        let newBook = false;
        if (this.docSets.includes(docSet) && this.docSet !== docSet) {
            this.docSet = docSet;
            this.collection = docSet.split('_')[1];
            this.catalog = await this.fetchCatalog(this.docSet);
            this.books = this.catalog.documents.map((b) => b.bookCode);
            this.allBookIds = [
                ...this.books,
                ...(this.catalog.htmlBooks ? this.catalog.htmlBooks.map((b) => b.id) : [])
            ];
            newBook = true;
        }
        if (book !== this.book && this.allBookIds.includes(book)) {
            this.book = book;
            newBook = true;
        }
        this.updateChapterVerse(chapter, verse, newBook);
    }

    private updateChapterVerse(chapter: string, verse: string, newBook: boolean) {
        if (newBook) {
            this.versesByChapters =
                this.catalog.documents.find((b) => this.book === b.bookCode)?.versesByChapters ??
                {};
        }
        this.updateChapter(chapter);
        this.verse = verse;
    }

    private updateChapter(chapter: string) {
        if (chapter === 'i') {
            // The "chapter" is an introduction.
            this.chapter = chapter;
            this.chapterLength = 1;
        } else if (Object.keys(this.versesByChapters).includes(chapter)) {
            // The new chapter is valid.
            this.chapter = chapter;
            this.chapterLength = Object.keys(this.versesByChapters[this.chapter]).length;
        } else if (Object.keys(this.versesByChapters).length === 0) {
            // Seems like this should never happen, but the original reference store worked this way.
            // Actually, HtmlBooks should hit this condition.
            this.chapter = '1';
            this.chapterLength = 1;
        }
    }

    private updateAudio() {
        this.audio = this.config?.traits?.['has-audio']
            ? (this.config.bookCollections
                  ?.find((x) => x.id === this.collection)
                  ?.books.find((x) => x.id === this.book)
                  ?.audio.find((x) => String(x.num) === this.chapter) as BookCollectionAudioConfig)
            : undefined;
    }

    private updateHeadings() {
        const document = this.catalog.documents.find((b) => b.bookCode === this.book);
        if (document) {
            this.title = document.toc;
            this.name = document.h;
            return;
        }

        const htmlBook = this.catalog.htmlBooks?.find((b) => b.id === this.book);
        if (htmlBook) {
            this.title = htmlBook.name;
            this.name = htmlBook.name;
        }
    }

    private updateReference() {
        this.reference = [this.docSet, this.book, this.chapter].join('.');
        if (this.verse) {
            this.reference += '.' + this.verse;
        }
    }

    private updateNextPrev() {
        if (Object.keys(this.versesByChapters).length > 0) {
            const chapters = Object.keys(this.versesByChapters);
            const c = chapters.indexOf(this.chapter);
            const b = this.books.indexOf(this.book);
            this.updateNext(b, c, chapters);
            this.updatePrev(b, c, chapters);
        } else {
            this.prev = { book: null, chapter: null };
            this.next = { book: null, chapter: null };
        }
    }

    private updateNext(bookNum: number, chapterNum: number, chapters: string[]) {
        if (chapterNum + 1 < chapters.length) {
            this.next = { book: this.book, chapter: chapters[chapterNum + 1] };
        } else if (bookNum + 1 < this.books.length) {
            const nextDocument = this.catalog.documents[bookNum + 1];
            const nextChapters = Object.keys(nextDocument.versesByChapters);
            this.next = { book: nextDocument.bookCode, chapter: nextChapters[0] };
        } else {
            this.next = { book: null, chapter: null };
        }
    }

    private updatePrev(bookNum: number, chapterNum: number, chapters: string[]) {
        if (chapterNum - 1 >= 0) {
            this.prev = { book: this.book, chapter: chapters[chapterNum - 1] };
        } else if (bookNum - 1 >= 0) {
            const prevDocument = this.catalog.documents[bookNum - 1];
            const prevChapters = Object.keys(prevDocument.versesByChapters);
            this.prev = {
                book: prevDocument.bookCode,
                chapter: prevChapters[prevChapters.length - 1]
            };
        } else {
            this.prev = { book: null, chapter: null };
        }
    }

    async gotoNext() {
        if (this.next.book && this.next.chapter) {
            await this.goto(this.docSet, this.next.book, this.next.chapter);
        }
    }

    async gotoPrev() {
        if (this.prev.book && this.prev.chapter) {
            await this.goto(this.docSet, this.prev.book, this.prev.chapter);
        }
    }
}
