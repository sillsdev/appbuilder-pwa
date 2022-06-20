<script lang="ts">
    import '$src/app';
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
    <h1 class="text-center">{text.title}</h1>
    {#each text.paragraphs as paragraph}
        <p>
            {#each Object.entries(paragraph) as [verse, verseData]}
                <span id={verse}
                    ><h4>{verse}</h4>
                    {#each Object.entries(verseData) as [versePart, verseText]}
                        <span id={verse + versePart}>
                            {verseText + ' '}
                        </span>
                    {/each}
                </span>
            {/each}
        </p>
    {/each}
</article>

<style>
    h4 {
        display: inline;
    }
</style>
