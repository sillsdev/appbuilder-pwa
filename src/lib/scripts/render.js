const seps = '.?!:;,';
const seprgx = /(\.|\?|!|:|;|,|')/g;
const subc = 'abcdefghijklmnopqrstuvwxyz';

export const renderDoc = (
    mainSeq,
    root,
    /**@type{function(root)}*/ postprocess,
    /**@type{function(data, element)}*/ graftHandler,
    /**@type{function(root)}*/ finalprocess
) => {
    if (!root || !mainSeq?.blocks?.length) return;
    root.replaceChildren(); //clear current blocks from root

    const grafts = [];

    /**add graft to array and create placeholder*/
    const renderGraft = (graft) => {
        grafts.push(graft);
        return '_{graft-' + (grafts.length - 1) + '}_';
    };
    /**parse innerHTML into phrases*/
    const parsePhrases = (/**@type{string}*/ inner) => {
        /**@type{string[]}*/ let phrases = inner.split(seprgx);
        for (let i = 1; i < phrases.length; i += 2) {
            phrases[i - 1] += phrases[i];
        }
        phrases = phrases.filter((s) => s.length > 0 && (s.length > 1 || !s.match(seprgx)));

        //move chars orphaned by phrase parsing to preceding phrase
        if (phrases.length > 1) {
            for (let i = 0; i < phrases.length - 1; i++) {
                const next = phrases[i + 1].split('');
                let c = next.shift();
                while (c && c.match(/[^_a-z]/i)) {
                    phrases[i] += c;
                    c = next.shift();
                }
                if (c) {
                    next.unshift(c);
                    phrases[i + 1] = next.join('');
                } else {
                    phrases.splice(i + 1, 1);
                    i--;
                }
            }
        }

        //shift grafts at start of phrase to end of next phrase
        for (let i = 1; i < phrases.length; i++) {
            const m = phrases[i].match(/^_\{graft-[0-9]\}_/);
            if (m) {
                phrases[i - 1] += m[0];
                phrases[i] = phrases[i].replace(m, '');
            }
        }
        return phrases;
    };
    /**render array of phrases*/
    const renderPhrases = (phrases, parent, kv) => {
        for (let i = 0; i < phrases.length; i++) {
            const phrase = document.createElement('div');
            phrase.setAttribute('data-verse', kv[i].split('-')[0]);
            phrase.setAttribute('data-phrase', kv[i].split('-')[1] ? kv[i].split('-')[1] : 'none');
            phrase.classList.add('txs', 'seltxt');

            phrases[i] = phrases[i].replace(/(_\{graft-[0-9]+\}_)/g, (m) => {
                return `<span data-graft="${m.match(/[0-9]+/)}">${m}</span>`;
            });

            phrase.innerHTML = phrases[i];
            phrase.getElementsByClassName('vsp').item(0)?.append('\xA0');

            parent.append(phrase);
        }
    };
    /**parses out verse number*/
    const parseVerseNumber = (inner) => {
        let v = null;
        let phrases = [''];

        inner = inner.split(/(_\{verse-[0-9]+\}_)/);
        if (inner.length === 3) {
            v = inner[1].replace(/(_|\{|\}|verse-)/g, '');
            phrases[0] = `${inner[0]}<span class="v">${v}</span><span class="vsp"></span>`;
            phrases[1] = inner[2];
        } else {
            phrases[0] = inner[0];
        }

        return { v: v, phrases: phrases };
    };

    const renderBlock = (block, parent) => {
        if (block.type === 'graft') {
            const s = renderGraft(block.sequence);
            parent.innerHTML += `<span data-graft="${s.match(/[0-9]+/)}">${s}</span>`;
        } else if (block.type === 'paragraph') {
            const div = document.createElement('div');
            const subtype = block.subtype.split(':')[1];
            div.classList.add(subtype);
            for (const content of block.content) {
                renderContent(content, div, subtype);
            }
            // process non poetry blocks
            if (subtype === 'p') {
                const content = Array.from(div.getElementsByTagName('div'));
                div.replaceChildren();
                for (const el of content) {
                    let inner = el.innerHTML;
                    el.replaceChildren();

                    let o = parseVerseNumber(inner);
                    let v = o.v;

                    if (v) {
                        inner = parsePhrases(o.phrases[1]);
                        inner[0] = o.phrases[0] + inner[0];

                        //handle phrases
                        renderPhrases(
                            inner,
                            div,
                            inner.length > 1 ? inner.map((e, i) => v + '-' + subc.charAt(i)) : [v]
                        );
                    } else {
                        inner = parsePhrases(o.phrases[0]);
                        el.innerHTML = inner.join('');
                        div.append(el);
                    }
                }
            }
            parent.append(div);
        } else {
            console.log('unknown block type: ' + block.type + ' encountered');
        }
    };

    const renderContent = (content, parent, blockType) => {
        if (!content.type) {
            parent.append(content);
        } else if (content.type === 'wrapper') {
            if (content.subtype === 'verses') {
                if (blockType === 'p') {
                    const div = document.createElement('div');
                    div.classList.add('unprocessed');
                    div.setAttribute('data-number', content.atts.number);
                    for (const c2 of content.content) {
                        renderContent(c2, div, blockType);
                    }
                    parent.append(div);
                } else {
                    for (const c2 of content.content) {
                        renderContent(c2, parent, blockType);
                    }
                }
            } else {
                for (const c2 of content.content) {
                    renderContent(c2, parent, blockType);
                }
            }
        } else if (content.type === 'mark') {
            if (content.subtype === 'chapter_label') {
                const div = document.createElement('div');
                div.classList.add('c-drop');
                div.append(content.atts.number);
                parent.append(div);
            } else if (content.subtype === 'verses_label') {
                parent.append(`_{verse-${content.atts.number}}_`);
            } else {
                console.log('unknown mark subtype: ' + content.subtype + ' encountered');
            }
        } else if (content.type === 'graft') {
            const s = renderGraft(content.sequence);
            parent.innerHTML += `${s}`;
        } else {
            console.log('unknown content type: ' + content.type + ' encountered');
        }
    };

    //<<<<< render main sequence >>>>>
    for (const block of mainSeq.blocks) {
        renderBlock(block, root);
    }
    // process poetry here, since it spans multiple blocks
    const poetryBlocks = Array.from(root.getElementsByTagName('div')).filter(
        (e) => e.classList.contains('q') || e.classList.contains('q2')
    );
    const content = poetryBlocks.map((e) => e.innerHTML);
    let v = '0';
    let phraseI = 0;
    for (let i = 0; i < poetryBlocks.length; i++) {
        poetryBlocks[i].replaceChildren();
        let o = parseVerseNumber(content[i]);
        let inner = o.phrases;

        if (o.v) {
            v = o.v;
            phraseI = 0;
            let tail = parsePhrases(inner[1]);
            inner[0] += tail[0];
            tail.shift();
            inner = [inner[0]].concat(tail);
        } else {
            inner = parsePhrases(inner[0]);
        }

        //handle phrases
        renderPhrases(
            inner,
            poetryBlocks[i],
            inner.map((e) => {
                const s = v + '-' + subc.charAt(phraseI);
                phraseI++;
                return s;
            })
        );
    }
    // handle orphaned blocks
    const orphanedBlocks = Array.from(root.getElementsByClassName('unprocessed'));
    for (let i = 0; i < orphanedBlocks.length; i++) {
        // don't need to handle verse numbers. if it had verse numbers, it wouldn't be orphaned.
        let inner = parsePhrases(orphanedBlocks[i].innerHTML);
        inner = inner.filter((s) => !s.match(/^\s+$/));

        orphanedBlocks[i].replaceChildren();
        orphanedBlocks[i].classList.add('current');

        const n = orphanedBlocks[i].getAttribute('data-number');
        const p =
            Array.from(
                root.querySelectorAll(
                    `div[data-verse="${orphanedBlocks[i].getAttribute('data-number')}"]`
                )
            )
                .map((el) => subc.indexOf(el.getAttribute('data-phrase')))
                .sort((a, b) => b - a)[0] + 1;
        renderPhrases(
            inner,
            orphanedBlocks[i],
            inner.map((e, i) => n + '-' + subc.charAt(p + i))
        );
        orphanedBlocks[i].insertAdjacentHTML('afterend', orphanedBlocks[i].innerHTML);
        orphanedBlocks[i].remove();
    }

    postprocess(root);

    if (graftHandler) {
        grafts.forEach((g, i) => {
            const el = root.querySelector(`span[data-graft="${i}"]`);
            graftHandler(g, el);
        });
    } else {
        console.log('No graft handler was provided. Graft placeholders will be left in text.');
    }

    finalprocess(root);
};
