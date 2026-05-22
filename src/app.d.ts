/// <reference types="@sveltejs/kit" />
/// <reference types="svelte-gestures" />
/// <reference types="$config" />
/// <reference types="svelte" />

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

    type MenuActionHandler = (args: { text: string; url: string }) => void;

    type TabMenuActionHandler = (args: { text: string; url: string; tab: string }) => void;

    interface TabMenuOptions {
        [key: string]: {
            tab?: {
                icon?: Snippet<[string]>;
            };
            snippet?: Snippet<[string, TabMenuActionHandler]>;
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
        name?: string;
        // boolean value for if a collection is allowed
        // to be shown in single pane view
        singlePane: boolean;
        description?: string;
        image?: string;
    }

    interface CollectionGroup {
        singlePane?: CollectionEntry;
        sideBySide?: [CollectionEntry, CollectionEntry];
        verseByVerse?: [CollectionEntry, CollectionEntry, CollectionEntry];
    }

    interface UserPreferenceSetting {
        type: 'checkbox' | 'list' | 'time';
        category: string;
        title: string;
        summary?: string;
        key: string;
        entries?: string[];
        values?: string[];
        value?: FeatureValue;
        defaultValue?: FeatureValue;
    }
}

declare namespace svelte.JSX {
    interface HTMLProps<T> {
        onoutclick?: () => void;
    }
}
