<script lang="ts">
    import { expoInOut } from 'svelte/easing';
    import { fly } from 'svelte/transition';

    interface Props {
        reversalLanguage: string;
        selectedLanguage: string;
        vernacularLanguage: string;
        onSwitchLanguage: (lang: string) => void;
    }

    let { reversalLanguage, selectedLanguage, onSwitchLanguage, vernacularLanguage }: Props =
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
    <div
        role="button"
        tabindex="0"
        aria-pressed={selectedLanguage === reversalLanguage}
        onclick={() => onSwitchLanguage(reversalLanguage)}
        onkeydown={(e) => e.key === 'Enter' && onSwitchLanguage(reversalLanguage)}
        class="py-2.5 px-3.5 text-sm uppercase text-center relative dy-tabs dy-tabs-bordered mb-1"
    >
        {reversalLanguage}
        {#if selectedLanguage === reversalLanguage}
            <div
                transition:fly={{ easing: expoInOut, x: -70 }}
                class="absolute -bottom-1 left-0 w-full h-1 bg-black"
            ></div>
        {/if}
    </div>
    <div class="flex-1"></div>
</div>
