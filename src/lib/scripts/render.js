
const seps = '.?!:;,';

export const renderBlocks = (root, blocks) => {
    if (!root || !blocks?.length) return;
    root.replaceChildren(); // clear current blocks from root
    for (let i = 0; i < blocks.length; i ++)
        root.append(renderBlock(blocks[i], i? 'p' : 'm'));
}

const renderBlock = (block, className) => {
    const div = document.createElement('div');
    div.className = className;
    //console.log(JSON.stringify(block, null, 2));
    let i = 0;
    while (i < block.items.length) {
        const it = block.items[i];
        if (it.subType === "start" && it.payload.split('/')[0] === 'verses') {
            const o = renderVerse(block.items, block.items[i].payload.split('/')[1], i+1);
            div.append(o.verse);
            i = o.i;
        }
        i++;
    }
    return div;
}

const renderVerse = (items, verseNum, index) => {
    const verse = document.createElement('span');
    verse.append(verseNum + ' ');
    let i = index;
    while (i < items.length) {
        const it = items[i];
        if (it.type === "token") {
            verse.append(items[i].payload);
        }
        else if (it.type === "scope" && it.subType === "end" && it.payload.split('/')[0] === 'verses') {
            break;
        }

        i++;
    }
    

    return { verse: verse, i: i }
}

const renderPhrase = (items, index) => {
    const phrase = document.createElement('span');
    

    return { phrase: phrase, i: index }
}
