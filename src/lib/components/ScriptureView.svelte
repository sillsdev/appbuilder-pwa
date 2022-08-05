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
    import { audioHighlight, refs, scrolls, playingAudio } from '$lib/data/stores';
    import { inview } from 'svelte-inview';
    import { renderBlocks } from '../scripts/render';

    let container: HTMLElement;
    let blocksRoot: Element;
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

    /**list of verses in view*/
    let verses: string[] = [];
    /**updates list of verses in view*/
    const handleChange = (() => {
        let changeTimer: NodeJS.Timeout;

        return (e: CustomEvent<ObserverEventDetails>, id: string) => {
            clearTimeout(changeTimer);
            if (e.detail.inView) {
                verses.push(id);
                verses = verses.sort((a, b) => {
                    if (a === 'title') return -1;
                    return parseInt(a) - parseInt(b);
                });
            } else {
                verses = verses.filter((v) => v !== id);
            }
            if (verses.length > 0)
                changeTimer = setTimeout(() => {
                    scrolls.set(verses[0], group, key);
                }, 500); //waits 1/2 second before pushing update
        };
    })();

    /**shorter highlight variable*/
    $: hglt = $playingAudio ? $audioHighlight : '';
    /**moves highlight*/
    const highlightInView = (id: string) => {
        if (!$playingAudio) return;
        const el = container?.getElementsByClassName('highlighting')?.item(0);
        if (el && (id === 'title' ? id : id.replace(/[a-z]/g, '')) == verses[verses.length - 1]) {
            el.scrollIntoView();
        }
    };
    $: highlightInView($audioHighlight);

    /**options object for inview action*/
    const options = { threshold: 0.5 };

    onDestroy(unSub);

    /**queries SABProskomma instance to get scripture*/
    $: promise = query(`{
        docSet(id:"${$refs.docSet}") {
            book: document(bookCode: "${$refs.book}") {
                main: mainSequence {
                    blocks(withScriptureCV: "${$refs.chapter}") {
                        bs { payload }
                        items { type subType payload }
                    }
                }
            }
        }
    }`, (r) => {
        renderBlocks(blocksRoot, r.data?.docSet?.book?.main?.blocks);
    });
</script>

<article class="prose container mx-auto" bind:this={container}>
    <div
        id="title"
        class="scroll-item"
        class:highlighting={hglt === 'title'}
        use:inview={options}
        on:change={(e) => handleChange(e, 'title')}
    >
        <h1>{$refs.title}</h1>
        <h2>Chapter {$refs.chapter}</h2>
    </div>
    <div bind:this={blocksRoot}></div>
    <!--
    {#await promise}
        <p>loading . . .</p>
    {:then res}
        <!-- if blocks is not an array it means the query did not return what was expected--
        {#if Array.isArray(res.data.docSet?.book?.main.blocks)}
            <!-- create paragraphs from blocks --
            {#each res.data.docSet?.book?.main.blocks as block, i}
                
                    <div class={i === 0 ? 'm' : 'p'}>
                    {#each block.items as item}
                        {#if item.type === 'scope' && item.subType === 'start'}
                            {#if item.payload.split('/')[0] === 'verses'}
                                <em
                                    id={item.payload.split('/')[1]}
                                    class="scroll-item"
                                    use:inview={options}
                                    on:change={(e) => handleChange(e, item.payload.split('/')[1])}
                                    >{item.payload.split('/')[1]}</em
                                ><span>&nbsp;</span>
                            {:else}
                                <!-- does nothing currently --
                                {/if}
                                {:else if item.type === 'token'}
                                    {item.payload}
                                {/if}
                            {/each}
                    </div>
                
            {/each}
        {:else}
            <p>waiting on SABProskomma . . .</p>
        {/if}
    {:catch err}
        <pre style="color: red">{err.message}</pre>
    {/await}
    -->
    <!-- previous hard coded example that had highlight working
    <p>
        {#each Object.entries(paragraph) as [verse, verseData]}
            <span
                id={verse}
                class="scroll-item"
                use:inview={options}
                on:change={(e) => handleChange(e, verse)}
                ><h4>{verse}</h4>
                {#if verseData['b']}
                    {#each Object.entries(verseData) as [versePart, verseText]}
                        <span
                            id={verse + versePart}
                            class:highlighting={hglt === verse + versePart}
                        >
                            {verseText + ' '}
                        </span>
                    {/each}
                {:else}
                    <span id={verse} class:highlighting={hglt === verse}>
                        {verseData['a'] + ' '}
                    </span>
                {/if}
            </span>
        {/each}
    </p>
    -->
</article>

<style>
    .highlighting {
        background-color: #ffff99;
    }
</style>
