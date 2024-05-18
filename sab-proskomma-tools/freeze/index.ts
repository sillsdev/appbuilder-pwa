import { gzipSync, strToU8 } from 'fflate';
import { SABProskomma } from '../../src/lib/sab-proskomma';

const freeze = (pk: SABProskomma) => {
    const result: { [key: string]: Uint8Array } = {};
    const docSets = Object.keys(pk.docSets);
    for (const docSet of docSets) {
        const stringified = JSON.stringify(pk.serializeSuccinct(docSet));
        const buf = strToU8(stringified);
        const compressed = gzipSync(buf);
        result[docSet] = compressed;
    }
    return result;
};

export { freeze };
