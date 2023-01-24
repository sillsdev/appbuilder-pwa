type docSetType = {
    id: string;
    tagsKv: { [key: string]: string };
    selectors: { [key: string]: string };
    documents: [any];
    sequences: { id: string };
};
type docSetsType = {
    docSets: [docSetType];
};
const parseChapterVerseMapInDocSets = (_ref: docSetsType) => {
    const { docSets: _docSets } = _ref;
    const docSets = _docSets?.length > 0 ? JSON.parse(JSON.stringify(_docSets)) : [];

    docSets?.forEach((docSet: any) => {
        if (docSet?.selectors?.forEach) {
            const selectors: { [key: string]: string } = {};

            docSet.selectors.forEach(({ key, value }: { [key: string]: string }) => {
                selectors[key] = value;
            });
            docSet.selectors = selectors;
        }

        if (docSet?.tagsKv?.forEach) {
            const tags: { [key: string]: string } = {};

            docSet.tagsKv.forEach(({ key, value }: { [key: string]: string }) => {
                tags[key] = value;
            });
            delete docSet.tagsKv;
            docSet.tags = tags;
        }

        docSet.documents.forEach((document: any) => {
            let introductions = false;
            if (document?.sequences?.length > 0) {
                introductions = true;
            }
            document.hasIntroduction = introductions;
            if (document?.cvNumbers) {
                const chaptersVersesObject: { [chapter: string]: any } = {};

                document?.cvNumbers?.forEach(({ chapter, verses }: { [chapter: string]: any }) => {
                    const versesObject: { [number: string]: number } = {};

                    verses.forEach(({ number, range }: { [number: string]: number }) => {
                        versesObject[number] = range;
                    });
                    chaptersVersesObject[chapter] = versesObject;
                });

                delete document.cvNumbers;
                document.versesByChapters = chaptersVersesObject;
            }
        });
    });

    return docSets;
};

export default parseChapterVerseMapInDocSets;
