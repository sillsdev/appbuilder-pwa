/**queries the proskomma endpoint*/
export const query = async (query, cb) => {
    const res = await fetch('/data/proskomma', {
        method: 'POST',
        body: JSON.stringify({
            query: minifyQuery(query)
        }),
        headers: {
            'content-type': 'application/json',
            accept: 'application/json'
        }
    });
    const j = await res.json();
    if (cb) cb(j);
    return j;
};

function minifyQuery(/**@type{string}*/ query) {
    let s = query.replace(/\n/g, ' ');
    return s.replace(/([^\w])(\s+)/g, '$1');
}
