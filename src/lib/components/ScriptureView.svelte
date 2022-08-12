<!--
@component
A component for displaying scripture.  
TODO:
- integrate SOFRIA
- add phrase info for highlight synchronization
- fully utilize groupStore functionality
- find a way to scroll smoothly, as CSS only option does not work as expected.
- change the global stylesheet to have .highlighting
-->
<script lang="ts">
    import { query } from '../scripts/query';
    import { onDestroy } from 'svelte';
    import { audioHighlight, refs, scrolls, audioActive, mainScroll } from '$lib/data/stores';
    import { renderDoc } from '../scripts/render';
    import { LoadingIcon } from '../icons';

    let container: HTMLElement;
    let bookRoot: Element;
    /**unique key to use for groupStore modifier*/
    const key = {};

    let group = 'default';
    let scrollId: string;
    let scrollMod: any;
    const unSub = scrolls.subscribe((val, mod) => {
        scrollId = val;
        scrollMod = mod;
    }, group);

    /**scrolls element with id into view*/
    const scrollTo = (id: string) => {
        if (scrollMod === key) return;
        container?.getElementsByClassName('scroll-item')?.namedItem(id)?.scrollIntoView();
    };
    $: scrollTo(scrollId);

    let lastVerseInView = '';

    const handleScroll = (() => {
        let scrollTimer: NodeJS.Timeout;

        return (trigger) => {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                const items = Array.from(container?.getElementsByClassName('scroll-item'))
                    .filter((it, i) => {
                        const rect = it.getBoundingClientRect();
                        const win = container.getBoundingClientRect();

                        return (
                            rect.top - win.top >= $mainScroll.top &&
                            rect.bottom - win.top <= $mainScroll.height + $mainScroll.top
                        );
                    })
                    .map((el) => el.id);

                scrolls.set(items[0], group, key);
                lastVerseInView = items[items.length - 1];
            }, 500);
        };
    })();
    $: handleScroll($mainScroll);

    /**updates highlight*/
    const updateHighlight = (h: string) => {
        const a = h.split(',');
        console.log(a);
        let el = container?.getElementsByClassName('highlighting')?.item(0);
        el?.classList.remove('highlighting');
        if (!$audioActive || a[0] !== $refs.docSet || a[1] !== $refs.book || a[2] !== $refs.chapter)
            return;
        el = container?.querySelector(`div[data-verse="${a[3]}"][data-phrase="${a[4]}"]`);
        console.log(el);
        el?.classList.add('highlighting');
        if (el && (a[3] === 'title' ? a[3] : a[3].replace(/[a-z]/g, '')) === lastVerseInView) {
            el.scrollIntoView();
        }
    };
    $: updateHighlight($audioHighlight);

    onDestroy(unSub);

    const showFootnote = (type: string, content: string) => {
        console.log(`${type}: ${content}`);
    };

    let loading = true;
    //queries SABProskomma instance to get scripture
    $: (() => {
        loading = true;
        query(
            `{
            docSet(id:"${$refs.docSet}") {
                book: document(bookCode: "${$refs.book}") {
                    sofria (indent: 4, chapter: ${$refs.chapter})
                }
            }
        }`,
            (r) => {
                const fnc = 'abcdefghijklmnopqrstuvwxyz';
                let fi = 0;
                //initial render
                renderDoc(
                    JSON.parse(r.data.docSet.book.sofria).sequence,
                    bookRoot,
                    (root) => {
                        let first = root.getElementsByTagName('div')?.item(0);
                        first?.classList.remove('p', 'q');
                        first?.classList.add('m');
                    },
                    (graft, el) => {
                        el.innerHTML = '';
                        if (graft.type === 'title') {
                            const div = document.createElement('div');
                            for (const block of graft.blocks) {
                                div.innerHTML += `<div class="${block.subtype.split(':')[1]}">${
                                    block.content[0]
                                }</div>`;
                            }
                            div.innerHTML += `<div class="b"></div><div class="b"></div>`;
                            div.setAttribute('data-verse', 'title');
                            div.setAttribute('data-phrase', 'none');
                            div.classList.add('scroll-item');
                            el.append(div);
                        } else if (graft.type === 'footnote' || graft.type === 'xref') {
                            let content = graft.blocks[0].content;
                            if (content[0].type !== 'graft') content = content[0];
                            if (content.subtype === 'chapter') content = content.content[0];
                            if (content.subtype === 'verses') content = content.content;
                            content = content
                                .map((c) => (c.type === 'wrapper' ? c.content[0] : ''))
                                .join('');
                            //console.log(JSON.stringify(content));
                            el.classList.add('footnote');
                            const a = document.createElement('a');
                            a.innerHTML += `<sup>${fnc.charAt(fi)}</sup>`;
                            a.addEventListener('click', () =>
                                showFootnote(graft.type, JSON.stringify(content))
                            );
                            el.append(a);
                            fi++;
                        } else {
                            console.log(`unknown graft type: ${graft.type} encontered`);
                        }
                    },
                    (root) => {
                        loading = false;
                    }
                );
            }
        );
    })();
</script>

<article class="prose container mx-auto" bind:this={container}>
    {#if loading}
        <LoadingIcon />
    {/if}
    <div bind:this={bookRoot} class:hidden={loading} />
</article>
