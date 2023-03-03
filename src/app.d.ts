/// <reference types="@sveltejs/kit" />
/// <reference types="svelte-gestures" />

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare namespace App {
    // interface Locals {}
    // interface Platform {}
    // interface Session {}
    // interface Stuff {}
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
        highlight_color: string;
    }

    interface TabMenuOptions {
        [key: string]: {
            tab?: {
                component: any;
                props?: any;
            };
            component: any;
            props: any;
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

    interface UserPreferenceSetting {
        type: 'checkbox' | 'list' | 'time';
        category: string;
        title: string;
        summary?: string;
        key: string;
        defaultValue: string | boolean;
        entries?: string[];
        values?: string[];
        value?: string | boolean;
    }
}

declare namespace svelte.JSX {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface HTMLProps<T> {
        onoutclick?: () => void;
    }
}
