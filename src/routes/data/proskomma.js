import { SABProskomma } from '../../../sab-proskomma';
import path from 'path';
import { readFileSync } from 'fs';
import { thaw } from 'proskomma-freeze';
import { collections } from '../../../static/collections';

const pk = (() => {
    let _val = new SABProskomma();


    //thaws frozen archives
    const initialized = (async () => {
        console.log('initializing Proskomma')
        const promises = [];
        for (const c of collections) {
            promises.push(thaw(_val, readFileSync(path.join('static', 'collections', c+'.pkf'),'utf8')));
        }
        return Promise.all(promises);
    })();

    const query = async (q, cb) => {
        await initialized;
        return _val.gqlQuery(q, cb);
    };

    const gqlQuery = async (q, cb) => {
        query(q, cb);
    };

    return { query, gqlQuery };
})();

export async function post({ request }) {
    const body = await request.json();
    return {
        body: await pk.query(body.query)
    };
}
