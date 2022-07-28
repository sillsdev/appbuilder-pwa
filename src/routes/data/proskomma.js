import { SABProskomma } from '../../../sab-proskomma';
import { thaw } from 'proskomma-freeze';
import { collections } from '$lib/data/book-collections';

const pk = (() => {
    let _val = new Proskomma();

    const memo = { initialized: null };
    function memoInit() {
        if (memo['initialized'] !== null) {
            return memo['initialized'];
        }

        memo['initialized'] = init(); // memoize the promise for key
        return memo['initialized'];
    }

    //thaws frozen archives
    const init = async () => {
        for (const c of collections) {
            await thaw(_val, c);
        }
    };

    const query = async (q, cb) => {
        memoInit();
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
