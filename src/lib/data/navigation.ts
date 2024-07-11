import { type CatalogData, loadCatalog } from './catalogData';
import configuration from './config';

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
    audio: any;
    title: string;
    name: string;
    catalog: CatalogData;
    next: { book: string | null; chapter: string | null } = { book: null, chapter: null };
    prev: { book: string | null; chapter: string | null } = { book: null, chapter: null };
    initialized = false;

    protected fetchCatalog = loadCatalog;
    protected config = configuration;

    private docSets: string[];
    private books: string[];
    private versesByChatper: { [chapter: string]: { [verse: string]: string } };

    async gotoInitial(start: string = '') {
        this.docSets = this.config.bookCollections.map((bc) => `${bc.languageCode}_${bc.id}`);
        this.initialized = true;
        start = start || this.config.mainFeatures['start-at-reference'];
        if (start) {
            await this.gotoReference(start);
        } else {
            const collection = this.config.bookCollections[0];
            await this.goto(
                this.docSets[0],
                collection.books[0].id,
                collection.books[0].chaptersN.split('-')[0],
                '1'
            );
        }
    }

    async gotoReference(reference: string) {
        const ref = reference.split('.');
        if (ref.length === 2) {
            // Deprecated 2-part reference.
            await this.goto(this.docSets[0], ref[0], ref[1], '1');
        } else {
            await this.goto(ref[0], ref[1], ref[2], '1');
        }
    }

    async goto(docSet: string, book: string, chapter: string, verse: string = '') {
        if (!this.initialized) {
            throw new Error('NavigationContext is not initialized; please call gotoInitial()');
        }
        await this.updateLocation(docSet, book, chapter, verse);
        this.updateAudio();
        this.updateHeadings();
        this.updateNextPrev();
        this.updateReference();
    }

    private async updateLocation(docSet: string, book: string, chapter: string, verse: string) {
        let newBook = false;
        if (this.docSets.includes(docSet) && this.docSet !== docSet) {
            this.docSet = docSet;
            this.collection = docSet.split('_')[1];
            this.catalog = await this.fetchCatalog(this.docSet);
            this.books = this.catalog.documents.map((b) => b.bookCode);
            newBook = true;
        }
        if (book !== this.book && this.books.includes(book)) {
            this.book = book;
            newBook = true;
        }
        this.updateChapterVerse(chapter, verse, newBook);
    }

    private updateChapterVerse(chapter: string, verse: string, newBook: boolean) {
        if (newBook) {
            this.versesByChatper = this.catalog.documents.find(
                (b) => this.book === b.bookCode
            ).versesByChapters;
        }
        this.updateChapter(chapter);
        this.verse = verse;
    }

    private updateChapter(chapter: string) {
        if (chapter === 'i') {
            // The "chapter" is an introduction.
            this.chapter = chapter;
            this.chapterLength = 1;
        } else if (Object.keys(this.versesByChatper).includes(chapter)) {
            // The new chapter is valid.
            this.chapter = chapter;
            this.chapterLength = Object.keys(this.versesByChatper[this.chapter]).length;
        } else if (Object.keys(this.versesByChatper).length === 0) {
            // Seems like this should never happen, but the original reference store worked this way.
            this.chapter = '1';
            this.chapterLength = 1;
        }
    }

    private updateAudio() {
        this.audio =
            this.config.traits['has-audio'] &&
            this.config.bookCollections
                .find((x) => x.id === this.collection)
                .books.find((x) => x.id === this.book)
                ?.audio.find((x) => String(x.num) === this.chapter);
    }

    private updateHeadings() {
        const document = this.catalog.documents.find((b) => b.bookCode === this.book);
        this.title = document.toc;
        this.name = document.h;
    }

    private updateReference() {
        this.reference = [this.docSet, this.book, this.chapter].join('.');
        if (this.verse) {
            this.reference += '.' + this.verse;
        }
    }

    private updateNextPrev() {
        const chapters = Object.keys(this.versesByChatper);
        const c = chapters.indexOf(this.chapter);
        const b = this.books.indexOf(this.book);
        this.updateNext(b, c, chapters);
        this.updatePrev(b, c, chapters);
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
        if (this.next.chapter) {
            await this.goto(this.docSet, this.next.book, this.next.chapter);
        }
    }

    async gotoPrev() {
        if (this.prev.chapter) {
            await this.goto(this.docSet, this.prev.book, this.prev.chapter);
        }
    }
}
