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
    import { audioHighlight, refs, scrolls, playingAudio, mainScroll } from '$lib/data/stores';
    import { renderDoc } from '../scripts/render';

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

    /**shorter highlight variable*/
    $: hglt = $playingAudio ? $audioHighlight : '';
    /**updates highlight*/
    const updateHighlight = (id: string) => {
        let el = container?.getElementsByClassName('highlighting')?.item(0);
        el?.classList.remove('highlighting');
        if (!$playingAudio) return;
        el = document.getElementById(id);
        el?.classList.add('highlighting');
        if (el && (id === 'title' ? id : id.replace(/[a-z]/g, '')) === lastVerseInView) {
            el.scrollIntoView();
        }
    };
    $: updateHighlight($audioHighlight);

    onDestroy(unSub);

    //queries SABProskomma instance to get scripture
    $: query(
        `{
        docSet(id:"${$refs.docSet}") {
            book: document(bookCode: "${$refs.book}") {
                sofria (indent: 4, chapter: ${$refs.chapter})
            }
        }
    }`,
        (r) => {
            //initial render
            const grafts = renderDoc(JSON.parse(r.data.docSet.book.sofria).sequence, bookRoot);
            //console.log(JSON.stringify(grafts, null, 2)); // handle grafts later

            //post process
            let firstp = bookRoot.getElementsByClassName('p')?.item(0);
            firstp?.classList.remove('p');
            firstp?.classList.add('m');
        }
    );
</script>

<article class="prose container mx-auto" bind:this={container}>
    <div id="title" class="scroll-item" class:highlighting={hglt === 'title'}>
        <h1>{$refs.title}</h1>
        <h2>Chapter {$refs.chapter}</h2>
    </div>
    <div bind:this={bookRoot} />
</article>

<style>
    .highlighting {
        background-color: #ffff99;
    }
</style>
