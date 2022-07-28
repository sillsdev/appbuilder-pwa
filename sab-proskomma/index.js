import { Proskomma, typeDefs, resolvers } from 'proskomma';

class SABProskomma extends Proskomma {
    constructor() {
        super();
    }

    processor() {
        return 'Proskomma JS for Scripture App Builder';
    }
}
