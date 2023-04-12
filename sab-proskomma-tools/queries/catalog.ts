const catalogQuery = ({ cv }: { cv: any }) => `{
    nDocSets nDocuments
    docSets {
      id
      tagsKv { key value }
      selectors { key value }
      hasMapping
      documents (
        sortedBy: "paratext"
      ) {
        id
        bookCode: header(id:"bookCode")
        h: header(id:"h")
        toc: header(id:"toc")
        toc2: header(id:"toc2")
        toc3: header(id:"toc3")
        ${
            cv
                ? `
            sequences(types:"introduction") { id }
            cvNumbers: cvIndexes {
              chapter
              verses: verseNumbers {
                number
                range
              }
            }
          `
                : ''
        }
      }
    }
  }`;

export default catalogQuery;
