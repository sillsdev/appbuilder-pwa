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
                    <p class="font-bold break-words">
                        {name}{#if homonym_index > 0}<sub>{homonym_index}</sub>{/if}
                    </p>
                    {#if summary}
                        <p class="ml-4 italic">
                            {#each summary.match(/{(.*?)}/g) as match}
                                {match.replace(/[{}]/g, '')}
                            {/each}
                        </p>
                    {/if}
                </div>
            </li>
        {/each}
    {:else}
        {#each reversalWordsList as { word, indexes, letter }}
            <li class="cursor-pointer text-lg mb-6" id="letter-{letter}">
                <div on:click={() => selectWord({ word, indexes })}>
                    <p class="font-bold break-words">{word}</p>
                    <p class="text-md ml-4">
                        {#each indexes as index, i}
                            {#if i > 0},
                            {/if}
                            {#await Promise.resolve(vernacularWordsList.find((vw) => vw.id === index)) then foundWord}
                                {#if foundWord}
                                    {foundWord.name}{#if foundWord.homonym_index > 0}<sub
                                            >{foundWord.homonym_index}</sub
                                        >{/if}
                                {:else}
                                    {console.log(`Index ${index} not found in vernacularWordsList`)}
                                    {index}
                                {/if}
                            {/await}
                        {/each}
                    </p>
                </div>
            </li>
        {/each}
    {/if}
</ul>
