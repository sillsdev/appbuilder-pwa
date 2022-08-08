const seps = '.?!:;,';
const subc = 'abcdefghijklmnopqrstuvwxyz';

export const renderBlocks = (root, blocks) => {
    if (!root || !blocks?.length) return;
    let grafts = [];
    root.replaceChildren(); // clear current blocks from root
    for (const block of blocks) {
        const bs = block.bs.payload.split('/')[1];
        const o = renderBlock(block, bs);
        root.append(o.block);
        grafts = grafts.concat(o.grafts);
    }
    return grafts;
};

const renderBlock = (block, className) => {
    const div = document.createElement('div');
    let grafts = [];
    div.classList.add(className);
    let i = 0;
    while (i < block.items.length) {
        const it = block.items[i];
        if (it.subType === 'start' && it.payload.split('/')[0] === 'verses') {
            const o = renderVerse(block.items, block.items[i].payload.split('/')[1], i + 1);
            div.append(o.verse);
            i = o.i;
            grafts = grafts.concat(o.grafts);
        } else if (it.type === 'graft') {
            const o = createGraft(it);
            div.append(o.el);
            grafts.push(o.id);
        }
        i++;
    }
    return { block: div, grafts: grafts };
};

const renderVerse = (items, verseNum, index) => {
    const verse = document.createElement('span');
    let grafts = [];
    //console.log('verse: '+verseNum);
    verse.append(verseNum + ' ');
    verse.id = verseNum;
    verse.classList.add('scroll-item');
    const phrases = [];
    let i = index;
    while (i < items.length) {
        const it = items[i];
        if (it.type === 'scope' && it.subType === 'end' && it.payload.split('/')[0] === 'verses') {
            break;
        } else if (it.type === 'token') {
            const o = renderPhrase(items, i, verseNum);
            phrases.push(o.phrase);
            grafts = grafts.concat(o.grafts);
            i = o.i;
        } else if (it.type === 'graft') {
            const o = createGraft(it);
            verse.append(o.el);
            grafts.push(o.id);
            i++;
        } else i++;
    }

    if (phrases.length > 1) {
        for (let j = 0; j < phrases.length; j++) phrases[j].id += subc[j];
    }
    for (const phrase of phrases) verse.append(phrase);

    return { verse: verse, i: i, grafts: grafts };
};

const renderPhrase = (items, index, id) => {
    const phrase = document.createElement('span');
    phrase.id = id;
    let s = '';
    let i = index;
    const grafts = [];
    while (i < items.length) {
        const it = items[i];
        i++;
        if (it.type === 'token') {
            s += it.payload;
            //console.log(it.payload);
            if (it.subType === 'punctuation' && seps.includes(it.payload)) {
                //console.log('found end of phrase marker')
                while (i < items.length) {
                    if (items[i].type === 'token' && items[i].subType !== 'wordLike') {
                        s += items[i].payload;
                        i++;
                    } else if (items[i].type !== 'graft') break;
                    else {
                        const o = createGraft(items[i]);
                        phrase.append(o.el);
                        grafts.push(o.id);
                        i++;
                    }
                }
                break;
            }
        } else if (
            it.type === 'scope' &&
            it.subType === 'end' &&
            it.payload.split('/')[0] === 'verses'
        ) {
            break;
        } else if (it.type === 'graft') {
            const o = createGraft(it);
            phrase.append(o.el);
            grafts.push(o.id);
        }
    }
    //console.log('phrase: '+s)
    phrase.append(s);

    return { phrase: phrase, i: i, grafts: grafts };
};

const createGraft = (item) => {
    const id = item.subType + '-' + item.payload;
    const ref = document.createElement('span');
    ref.id = id;
    return { id: id, el: ref };
};
