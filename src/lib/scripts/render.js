const seps = '.?!:;,';
const subc = 'abcdefghijklmnopqrstuvwxyz';

export const renderBlocks = (root, blocks) => {
    if (!root || !blocks?.length) return;
    root.replaceChildren(); // clear current blocks from root
    for (let i = 0; i < blocks.length; i++) root.append(renderBlock(blocks[i], i ? 'p' : 'm'));
};

const renderBlock = (block, className) => {
    const div = document.createElement('div');
    div.className = className;
    let i = 0;
    while (i < block.items.length) {
        const it = block.items[i];
        if (it.subType === 'start' && it.payload.split('/')[0] === 'verses') {
            const o = renderVerse(block.items, block.items[i].payload.split('/')[1], i + 1);
            div.append(o.verse);
            i = o.i;
        }
        i++;
    }
    return div;
};

const renderVerse = (items, verseNum, index) => {
    const verse = document.createElement('span');
    verse.append(verseNum + ' ');
    verse.id = verseNum;
    verse.className += 'scroll-item';
    const phrases = [];
    let i = index;
    while (i < items.length) {
        const it = items[i];
        if (it.type === 'scope' && it.subType === 'end' && it.payload.split('/')[0] === 'verses') {
            break;
        } else if (it.type === 'token') {
            const o = renderPhrase(items, i, verseNum);
            phrases.push(o.phrase);
            i = o.i;
        } else i++;
    }

    if (phrases.length > 1) {
        for (let j = 0; j < phrases.length; j++) phrases[j].id += subc[j];
    }
    for (const phrase of phrases) verse.append(phrase);

    return { verse: verse, i: i };
};

const renderPhrase = (items, index, id) => {
    const phrase = document.createElement('span');
    phrase.id = id;
    let s = '';
    let i = index;
    while (i < items.length) {
        const it = items[i];
        i++;
        if (it.type === 'token') {
            s += it.payload;
            if (it.subType === 'punctuation' && seps.includes(it.payload)) {
                while (i < items.length) {
                    if (items[i].type === 'token') {
                        s += items[i].payload;
                        i++;
                    } else break;
                }
                break;
            }
        } else if (
            it.type === 'scope' &&
            it.subType === 'end' &&
            it.payload.split('/')[0] === 'verses'
        ) {
            break;
        }
    }
    phrase.append(s);

    return { phrase: phrase, i: i };
};
