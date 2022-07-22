<script lang="ts">
    import { audioHighlight } from '$lib/data/stores';
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
</script>

<article class="prose container mx-auto">
    <h1 class="text-center" class:highlighting={$audioHighlight === 'title'}>{text.title}</h1>
    {#each text.paragraphs as paragraph}
        <p>
            {#each Object.entries(paragraph) as [verse, verseData]}
                <span id={verse}
                    ><h4>{verse}</h4>
                    {#if verseData['b']}
                        {#each Object.entries(verseData) as [versePart, verseText]}
                            <span
                                id={verse + versePart}
                                class:highlighting={$audioHighlight === verse + versePart}
                            >
                                {verseText + ' '}
                            </span>
                        {/each}
                    {:else}
                        <span id={verse} class:highlighting={$audioHighlight === verse}>
                            {verseData['a'] + ' '}
                        </span>
                    {/if}
                </span>
            {/each}
        </p>
    {/each}
</article>

<style>
    h4 {
        display: inline;
    }
    .highlighting {
        background-color: #ffff99;
    }
</style>
