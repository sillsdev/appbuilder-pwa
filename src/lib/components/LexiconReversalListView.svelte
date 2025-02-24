<script>
    import { base } from '$app/paths';

    export let selectedLanguage;
    export let vernacularLanguage;
    export let vernacularWordsList;
    export let reversalWordsList;
    export let selectWord;
    
</script>

<ul class="space-y-2">
    {#if selectedLanguage === vernacularLanguage}
        {#each vernacularWordsList as { id, name, homonym_index, type, num_senses, summary, letter }}
            <li class="cursor-pointer text-lg" id="letter-{letter}">
                <div on:click={() => selectWord({ word: name, index: id })}>
                    <p class="font-bold break-words">{name}</p>
                </div>
            </li>
        {/each}
    {:else}
        {#each reversalWordsList as { word, index, letter }}
            <li class="cursor-pointer text-lg" id="letter-{letter}">
                <div on:click={() => selectWord({ word, index })}>
                    <p class="font-bold break-words">{word}</p>
                    <p class="text-md ml-4">{index}</p>
                </div>
            </li>
        {/each}
    {/if}
</ul>