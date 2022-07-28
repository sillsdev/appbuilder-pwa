import { Proskomma, typeDefs, resolvers } from 'proskomma';

class SABProskomma extends Proskomma {
    constructor() {
        super();
        this.selectors = [
            {
                name: "lang",
                type: "string",
                regex: "^[A-Za-z0-9]{2,3}(-[A-Za-z0-9]+)*$"
            },
            {
                name: "abbr",
                type: "string",
                regex: "^[A-Za-z0-9]+$"
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
        }
        this.emptyBlocks = [];
    }

    processor() {
        return 'Proskomma JS for Scripture App Builder';
    }

    selectorString(docSetSelectors) {
        return `${docSetSelectors.lang}_${docSetSelectors.abbr}`;
    }
}

export { SABProskomma, typeDefs, resolvers };
