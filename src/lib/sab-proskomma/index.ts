// eslint-disable-next-line @typescript-eslint/triple-slash-reference
///<reference path="./proskomma.d.ts"/>

import { Proskomma } from 'proskomma-core';

/**
 * a custom extension of Proskomma to use BCP47 language tags instead of ISO 639-3
 * and whatever else may be needed in the future for use with SAB
 */
export class SABProskomma extends Proskomma {
    selectors: { name: string; type: string; regex: string }[];
    filters: any;
    customTags: {
        heading: string[];
        paragraph: string[];
        char: string[];
        word: string[];
        intro: string[];
        introHeading: string[];
    };
    emptyBlocks: any[];

    constructor() {
        super();

        //language tag regex sourced from: https://stackoverflow.com/a/60899733
        const grandfathered =
            '(' +
            /* irregular */ '(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)' +
            '|' +
            /* regular */ '(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang)' +
            ')';
        const langtag =
            '(' +
            '(' +
            //language
            ('([A-Za-z]{2,3}(-' +
                //extlang
                '([A-Za-z]{3}(-[A-Za-z]{3}){0,2})' +
                ')?)|[A-Za-z]{4}|[A-Za-z]{5,8})') +
            '(-' +
            '([A-Za-z]{4})' +
            ')?' + //script
            '(-' +
            '([A-Za-z]{2}|[0-9]{3})' +
            ')?' + //region
            '(-' +
            '([A-Za-z0-9]{5,8}|[0-9][A-Za-z0-9]{3})' +
            ')*' + //variant
            //extension
            '(-' +
            '(' +
            /* singleton */ ('[0-9A-WY-Za-wy-z]' + '(-[A-Za-z0-9]{2,8})+)') +
            ')*' +
            '(-' +
            '(x(-[A-Za-z0-9]{1,8})+)' +
            ')?' + //private use
            ')';

        this.selectors = [
            //BCP47 language tag
            {
                name: 'lang',
                type: 'string',
                regex: '^(' + grandfathered + '|' + langtag + '|' + '(x(-[A-Za-z0-9]{1,8})+)' + ')$'
            },
            {
                name: 'abbr',
                type: 'string',
                regex: '^[A-Za-z0-9 -]+$'
            }
        ];
        this.validateSelectors();
        this.filters = {};
        this.customTags = {
            heading: [],
            paragraph: [],
            char: [],
            word: [],
            intro: [],
            introHeading: []
        };
        this.emptyBlocks = [];
    }
    validateSelectors() {
        super.validateSelectors();
    }

    processor() {
        return 'Proskomma JS for Scripture App Builder';
    }

    selectorString(docSetSelectors: { lang: any; abbr: any }) {
        return `${docSetSelectors.lang}_${docSetSelectors.abbr}`;
    }

    gqlQuery(query: string, callback?: (r: any) => void) {
        return super.gqlQuery(query, callback);
    }

    loadSuccinctDocSet(succinctOb: any) {
        return super.loadSuccinctDocSet(succinctOb);
    }
}
