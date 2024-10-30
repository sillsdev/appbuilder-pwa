import { base } from '$app/paths';

let fetchFn = fetch;

export type PlanItem = {
    day: number;
    heading?:  {
        [lang: string]: string;
    };
    refs: string[];
};

export type PlansData = {
    id: string;
    title?: {
        [lang: string]: string;
    };
    description?: {
        [lang: string]: string;
    };
    image?: string;

    items?: PlanItem[];
};