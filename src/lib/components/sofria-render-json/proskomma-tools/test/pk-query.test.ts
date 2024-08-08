import { SABProskomma } from '$lib/sab-proskomma';
import { expect, test } from 'vitest';
import { sofriaRaw } from '../pk-query';

const usfm1 = `
\\id 001
\\c 1
\\m Hello
\\c 2
\\m world
`;

async function addDocument(pk: SABProskomma, usfm: string) {
    await pk.gqlQuery(
        `mutation {
            addDocument(
                selectors: [
                    {key: "lang", value: "eng"}, 
                    {key: "abbr", value: "C01"}
                ], 
                contentType: "usfm", 
                content: """${usfm}""",
            )
        }`
    );
}

test('sofriaRaw', async () => {
    const pk = new SABProskomma();
    await addDocument(pk, usfm1);
    const sofria = await sofriaRaw(pk, 'eng_C01', '001', 2);
    expect(sofria.schema.constraints[0].name).toBe('sofria');
});
