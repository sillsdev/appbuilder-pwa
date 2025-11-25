<script lang="ts">
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
</script>

<div class="flex w-full" style="background-color: var(--TabBackgroundColor);">
    <div
        role="button"
        tabindex="0"
        aria-pressed={selectedLanguage === vernacularLanguage}
        onclick={() => onSwitchLanguage(vernacularLanguage)}
        onkeydown={(e) => e.key === 'Enter' && onSwitchLanguage(vernacularLanguage)}
        class="py-2.5 px-3.5 text-sm uppercase text-center relative dy-tabs dy-tabs-bordered mb-1"
    >
        {vernacularLanguage}
        {#if selectedLanguage === vernacularLanguage}
            <div
                transition:fly={{ easing: expoInOut, x: 70 }}
                class="absolute -bottom-1 left-0 w-full h-1 bg-black"
            ></div>
        {/if}
    </div>
    {#each reversalLanguages as lang}
        <div
            role="button"
            tabindex="0"
            aria-pressed={selectedLanguage === lang}
            onclick={() => onSwitchLanguage(lang)}
            onkeydown={(e) => e.key === 'Enter' && onSwitchLanguage(lang)}
            class="py-2.5 px-3.5 text-sm uppercase text-center relative dy-tabs dy-tabs-bordered mb-1"
        >
            {lang}
            {#if selectedLanguage === lang}
                <div
                    transition:fly={{ easing: expoInOut, x: -70 }}
                    class="absolute -bottom-1 left-0 w-full h-1 bg-black"
                ></div>
            {/if}
        </div>
    {/each}
    <div class="flex-1"></div>
</div>
