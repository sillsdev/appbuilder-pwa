const seps = '.?!:;,';
const seprgx = /(\.|\?|!|:|;|,|')/g;
const subc = 'abcdefghijklmnopqrstuvwxyz';

export const renderDoc = (mainSeq, root) => {
    if (!root || !mainSeq?.blocks?.length) return;
    root.replaceChildren(); //clear current blocks from root

    const grafts = [];

    const renderSequence = (seq, parent) => {
        if (seq.type === 'main') {
            for (const block of seq.blocks) {
                renderBlock(block, parent);
            }
            // process poetry here, since it spans multiple blocks
            const poetryBlocks = Array.from(parent.getElementsByTagName('div')).filter(
                (e) => e.classList.contains('q') || e.classList.contains('q2')
            );
            console.log(poetryBlocks.map((e) => e.innerHTML));
        } else {
            const span = document.createElement('span');
            span.id = 'graft-' + grafts.length;
            span.append(' [' + span.id + '] ');
            parent.append(span);
            grafts.push(seq);
        }
    };

    const renderBlock = (block, parent) => {
        if (block.type === 'graft') {
            renderSequence(block.sequence, parent);
        } else if (block.type === 'paragraph') {
            const div = document.createElement('div');
            div.classList.add(block.subtype.split(':')[1]);
            for (const content of block.content) {
                renderContent(content, div);
            }
            // process non poetry blocks
            if (block.subtype.split(':')[1] === 'p') {
                const content = Array.from(div.getElementsByTagName('div'));
                div.replaceChildren();
                for (const el of content) {
                    const v = el.getElementsByClassName('v')?.item(0)?.innerHTML;
                    let inner = el.innerHTML.split(seprgx);
                    el.replaceChildren();

                    for (let i = 1; i < inner.length; i += 2) {
                        inner[i - 1] += inner[i];
                    }
                    inner = inner.filter((s) => s.length > 0 && (s.length > 1 || !s.match(seprgx)));

                    if (inner.length > 2) {
                        inner[0] += inner[1];
                        inner.splice(1, 1);

                        for (let i = 1; i < inner.length; i++) {
                            let s = inner[i].split(
                                /(<span id="graft-[0-9]+"> \[graft-[0-9]+\] <\/span>)/
                            );
                            if (s.length > 1) {
                                inner[i - 1] += s[1];
                                inner[i] = s[2];
                            }
                        }

                        for (let i = 0; i < inner.length; i++) {
                            const phrase = document.createElement('div');
                            phrase.classList.add('txs', 'seltxt');
                            phrase.id = v + subc.charAt(i);
                            phrase.innerHTML = inner[i];
                            div.append(phrase);
                        }
                    } else if (inner.length > 1) {
                        el.innerHTML = inner.join('');
                        div.append(el);
                    } else {
                        el.innerHTML = inner[0];
                        div.append(el);
                    }
                }
            }
            parent.append(div);
        } else {
            console.log('unknown block type: ' + block.type + ' encountered');
        }
    };

    const renderContent = (content, parent) => {
        if (!content.type) {
            parent.append(content);
        } else if (content.type === 'wrapper') {
            if (content.subtype === 'verses') {
                const div = document.createElement('div');
                div.id = content.atts.number;
                div.classList.add('txs', 'seltxt');
                for (const c2 of content.content) {
                    renderContent(c2, div);
                }
                parent.append(div);
            } else {
                for (const c2 of content.content) {
                    renderContent(c2, parent);
                }
            }
        } else if (content.type === 'mark') {
            if (content.subtype === 'chapter_label') {
                const div = document.createElement('div');
                div.classList.add('c-drop');
                div.append(content.atts.number);
                parent.append(div);
            } else if (content.subtype === 'verses_label') {
                const span = document.createElement('span');
                span.classList.add('v');
                span.append(content.atts.number);
                parent.append(span);

                const space = document.createElement('span');
                space.classList.add('vsp');
                space.innerHTML = '&nbsp;';
                parent.append(space);
            } else {
                console.log('unknown mark subtype: ' + content.subtype + ' encountered');
            }
        } else if (content.type === 'graft') {
            renderSequence(content.sequence, parent);
        } else {
            console.log('unknown content type: ' + content.type + ' encountered');
        }
    };

    renderSequence(mainSeq, root);

    return grafts;
};
