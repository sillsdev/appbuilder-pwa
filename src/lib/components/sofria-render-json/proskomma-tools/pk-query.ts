import type { SABProskomma } from '$lib/sab-proskomma';
import type { Document } from '../schema/sofria-schema';

export async function sofriaRaw(
    proskomma: SABProskomma,
    docSet: string,
    book: string,
    chapter: number
): Promise<Document> {
    const pkDocuments = await proskomma.gqlQuery(`{
        docSet(id: "${docSet}") {
            documents {
                id
                idParts {
                    parts
                }
            }
        }
    }`);

    if (!pkDocuments.data) {
        throw new Error(
            `Could not retrieve documents for docset ${docSet}\n` +
                `Proskomma response: ${JSON.stringify(pkDocuments)}`
        );
    }

    if (!pkDocuments.data.docSet) {
        throw new Error(
            `Could not load docset ${docSet}\n` +
                `Proskomma response: ${JSON.stringify(pkDocuments)}`
        );
    }

    const document = pkDocuments.data.docSet.documents.find((doc) =>
        doc.idParts.parts.includes(book)
    );

    if (!document) {
        throw new Error(`Could not find book ${book} in docset ${docSet}`);
    }

    const pageContent = await proskomma.gqlQuery(`{
        document(id: "${document.id}") {
            sofria(chapter: ${chapter})
        }
    }`);

    if (!pageContent.data) {
        throw new Error(
            `Could not retrieve sofria for chapter ${chapter} ` +
                `of document '${docSet}' (id: ${document.id})\n` +
                `Proskomma response: ${JSON.stringify(pageContent)}`
        );
    }

    return JSON.parse(pageContent.data.document.sofria);
}
