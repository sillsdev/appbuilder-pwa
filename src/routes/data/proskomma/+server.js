import { SABProskomma } from '../../../../sab-proskomma';
import path from 'path';
import { readFileSync } from 'fs';
import { thaw } from 'proskomma-freeze';
import { collections } from '../../../../static/collections';

const pk = (() => {
    let _val = new SABProskomma();

    //thaws frozen archives
    const initialized = (async () => {
        //console.log('initializing Proskomma');
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

export async function POST({ request }) {
    const body = await request.json();
    //throw new Error("@migration task: Migrate this return statement (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292701)");
    // Suggestion (check for correctness before using):

    return new Response(JSON.stringify(await pk.query(body.query)));
}
