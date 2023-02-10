// eslint-disable-next-line @typescript-eslint/triple-slash-reference
///<reference path="../../../sab-proskomma-tools/proskomma.d.ts"/>
import { strFromU8, decompressSync } from 'fflate';
import type { Proskomma } from 'proskomma-core';

const thaw = (pk: Proskomma, frozen: Uint8Array, selectorFunc: any = null, idFunc: any = null) => {
    selectorFunc =
        selectorFunc ||
        function (fo: any) {
            return fo;
        };
    idFunc =
        idFunc ||
        function (io: any) {
            return io;
        };
    const decompressed = decompressSync(frozen);
    const decompressedString = strFromU8(decompressed);
    const cJson = JSON.parse(decompressedString);
    cJson.metadata.selectors = selectorFunc(cJson.metadata.selectors);
    cJson.id = idFunc(cJson.id);
    return pk.loadSuccinctDocSet(cJson);
};
export { thaw };
