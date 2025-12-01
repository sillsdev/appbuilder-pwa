<script lang="ts">
    import { displayNames } from '$lib/data/stores/lexicon.svelte';
    import { expoInOut } from 'svelte/easing';
    import { fly } from 'svelte/transition';

    interface Props {
        reversalLanguages: string[];
        selectedLanguage: string;
        vernacularLanguage: string;
        onSwitchLanguage: (lang: string) => void;
    }

    let { reversalLanguages, selectedLanguage, onSwitchLanguage, vernacularLanguage }: Props =
        $props();

    const tabs = $derived([vernacularLanguage, ...reversalLanguages]);

    let lastSelected = $state(selectedLanguage);
    const indexOfPrevious = $derived(tabs.indexOf(lastSelected));

    function handleLangSelected(lang: string) {
        lastSelected = selectedLanguage;
        onSwitchLanguage(lang);
    }
</script>

<div class="flex w-full" style="background-color: var(--TabBackgroundColor);">
    {#each tabs as lang, i}
        <div
            role="button"
            tabindex="0"
            aria-pressed={selectedLanguage === lang}
            onclick={() => handleLangSelected(lang)}
            onkeydown={(e) => e.key === 'Enter' && handleLangSelected(lang)}
            class="py-2.5 px-3.5 text-sm uppercase text-center relative dy-tabs dy-tabs-bordered mb-1"
        >
            {displayNames.value[lang]}
            {#if selectedLanguage === lang}
                <div
                    transition:fly={{ easing: expoInOut, x: 70 * (indexOfPrevious - i) }}
                    class="absolute -bottom-1 left-0 w-full h-1 bg-black"
                ></div>
            {/if}
        </div>
    {/each}
    <div class="flex-1"></div>
</div>
