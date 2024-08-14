/// <reference types="@sveltejs/kit" />
/// <reference types="svelte-gestures" />

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare namespace App {
    // interface Locals {}
    // interface Platform {}
    // interface Session {}
    // interface Stuff {}

    interface Reference {
        docSet: string;
        book: string;
        chapter: string;
        verse: string;
    }

    interface Paragraph {
        [key: number]: {
            [key: string]: string;
        };
    }

    interface BibleText {
        title: string;
        book: string;
        chapter: string;
        bookmark: string;
        paragraphs: Paragraph[];
    }

    interface Highlight {
        id: string;
        reference: string;
        text: string;
        date: string;
        actions: string[];
        penColor: string;
    }

    interface TabMenuOptions {
        [key: string]: {
            tab?: {
                component: any;
                props?: any;
            };
            component: any;
            props: any;
            visible: boolean;
        };
    }

    interface GridEntry {
        id: string;
        label: string;
    }

    interface GridGroup {
        header?: string;
        rows?: GridEntry[];
        cells?: GridEntry[];
    }

    interface CollectionEntry {
        id: string;
        name: string;
        // boolean value for if a collection is allowed
        // to be shown in single pane view
        singlePane: boolean;
        description: string;
        image?: string;
    }

    interface CollectionGroup {
        singlePane?: CollectionEntry;
        sideBySide?: FixedLengthArray<[CollectionEntry, CollectionEntry]>;
        verseByVerse?: FixedLengthArray<[CollectionEntry, CollectionEntry, CollectionEntry]>;
    }

    interface UserPreferenceSetting {
        type: 'checkbox' | 'list' | 'time';
        category: string;
        title: string;
        summary?: string;
        key: string;
        entries?: string[];
        values?: string[];
        value?: string | boolean;
        defaultValue?: string | boolean;
    }
}

declare namespace svelte.JSX {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface HTMLProps<T> {
        onoutclick?: () => void;
    }
}
