<script lang="ts">
    import { query } from '../scripts/query';
    import { onDestroy } from 'svelte';
    import { audioHighlight, refs, scrolls, playingAudio } from '$lib/data/stores';
    import { inview } from 'svelte-inview';
    export let text: App.BibleText = {
        title: '',
        book: '',
        chapter: '',
        bookmark: '',
        paragraphs: [
            {
                1: {
                    a: ''
                }
            }
        ]
    };

    let container: HTMLElement;
    const key = {};
    
    let group = 'default';
    let scrollId: string;
    let scrollMod: any;
    const unSub = scrolls.subscribe((vals, mods) => {
        scrollId = vals[group];
        scrollMod = mods[group];
    });

    const scrollTo = (id: string, mod: any) => {
        if (scrollMod === key) return;
        container?.getElementsByClassName('scroll-item')?.namedItem(id)?.scrollIntoView();
    };
    $: scrollTo(scrollId, scrollMod);

    let verses: string[] = [];
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
                    $scrolls = { key: 'default', val: verses[0], mod: key };
                }, 500);
        };
    })();

    $: hglt = $playingAudio ? $audioHighlight : '';
    const highlightInView = (id: string) => {
        if(!$playingAudio) return;
        const el = container?.getElementsByClassName('highlighting')?.item(0);
        if (el && (id === 'title' ? id : id.replace(/[a-z]/g, '')) == verses[verses.length - 1]) {
            el.scrollIntoView();
        }
    };
    $: highlightInView($audioHighlight);

    const options = { threshold: 0.5 };

    onDestroy(unSub);

    $: promise = query(`{
        docSet(id:"${$refs['default'].docSet}") {
            book: document(bookCode: "${$refs['default'].book}") {
                main: mainSequence {
                    blocks(withScriptureCV: "${$refs['default'].chapter}") {
                        bs { payload }
                        items { type subType payload }
                    }
                }
            }
        }
    }`);
</script>

<article class="prose container mx-auto" bind:this={container}>
    <div
            id="title"
            class="scroll-item"
            use:inview={options}
            on:change={(e) => handleChange(e, "title")}>
            <h1>{$refs['default'].title}</h1>
            <h2>Chapter {$refs['default'].chapter}</h2>
        </div>
    {#await promise}
        <p>loading</p>
    {:then res}
        {#if Array.isArray(JSON.parse(res).data.docSet?.book?.main.blocks)}
            {#each JSON.parse(res).data.docSet?.book?.main.blocks as block, i}
                <div class="{i === 0?"m":"p"}">
                    {#each block.items as item}
                        {#if item.type === "scope" && item.subType === "start"}
                            {#if item.payload.split("/")[0] === "verses"}
                                <em id="{item.payload.split("/")[1]}"
                                    class="scroll-item"
                                    use:inview={options}
                                    on:change={(e) => handleChange(e, item.payload.split("/")[1])}
                                >{item.payload.split("/")[1]}</em><span>&nbsp;</span>
                            {:else}
                                <!---->
                            {/if}
                        {:else if item.type === "token"}
                            {item.payload}
                        {/if}
                    {/each}
                </div>
            {/each}
        {:else}
            <p>waiting on Proskomma . . .</p>
        {/if}
    {:catch err}
        <pre style="color: red">{err.message}</pre>
    {/await}
    <!--
    <h1
        id="title"
        class="text-center scroll-item"
        class:highlighting={hglt === 'title'}
        use:inview={options}
        on:change={(e) => handleChange(e, 'title')}
    >
        {text.title}
    </h1>
    {#each text.paragraphs as paragraph}
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
    {/each}
    -->
</article>

<style>
    h4 {
        display: inline;
    }
    .highlighting {
        background-color: #ffff99;
    }
</style>
