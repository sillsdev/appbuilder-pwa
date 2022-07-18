import { query } from '../scripts/query';
import { queries, postQueries } from 'proskomma-tools';

const q = await query(queries.catalogQuery({ cv: true }));
const catalog = postQueries.parseChapterVerseMapInDocSets({
    docSets: JSON.parse(q).data.docSets
});
export { catalog };
