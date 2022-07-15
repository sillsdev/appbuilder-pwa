/// <reference types="@sveltejs/kit" />

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
            handler?: function;
            component: any;
            props: any;
        };
    }

    interface Settings {
        [category: string]: {
            [setting: string]: {
                type: string;
                value: any;
                options?: string[];
                subtitle?: string;
            };
        };
    }
}

declare namespace svelte.JSX {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface HTMLProps<T> {
        onoutclick?: () => void;
    }
}
