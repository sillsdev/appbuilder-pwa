<script lang="ts">
    import config from '$lib/data/config';
    import {
        currentReversal,
        displayNames,
        isVernacular,
        reversals,
        selectedWord,
        selectWord,
        vernacularLanguageId,
        vernacularWords
    } from '$lib/data/stores/lexicon.svelte';
    import EntryView from '$lib/lexicon/components/EntryView.svelte';
    import HomonymSubscript from '$lib/lexicon/components/HomonymSubscript.svelte';
    import WordNavigationStrip from '$lib/lexicon/components/WordNavigationStrip.svelte';
    import { gotoRoute } from '$lib/navigate';
    import { onMount, tick } from 'svelte';
    import { expoInOut } from 'svelte/easing';
    import { fly } from 'svelte/transition';
    import type { PageData } from './$types';

    interface Props {
        data: PageData;
    }

    const { data }: Props = $props();

    const { vernacularAlphabet } = data;

    const alphabets = {
        reversal:
            reversals.size > 0
                ? (reversals.entries().next().value[1].keys().toArray() as string[])
                : [],
        vernacular: vernacularAlphabet
    };

    let selectedLetter = alphabets.vernacular[0];
    let scrollContainer: HTMLDivElement | undefined = $state(undefined);

    //$: selectedLanguage = currentReversal.selectedLanguage;
    $effect(() => {
        // NOTE: currentReversal is not a dependency of this $effect.
        // Do not make it a dependency, or this will not work.
        // If you need to console.log in here for debugging, make sure to use `untrack`.
        currentReversal.languageId = vernacularLanguageId.value;
    });

    const validReversal = $derived(reversals.has(currentReversal.languageId));

    async function scrollToLetter(letter: string) {
        await tick();
        const target = document.getElementById(`letter-${letter}`);
        if (target && scrollContainer) {
            const containerTop = scrollContainer.getBoundingClientRect().top;
            const targetTop = target.getBoundingClientRect().top;
            const offset = targetTop - containerTop + scrollContainer.scrollTop;

            scrollContainer.scrollTo({
                top: offset
            });
        }
    }

    async function handleLetterChange(letter: string) {
        selectedLetter = letter;
        scrollToLetter(letter);
    }

    function switchLanguage(language: string) {
        currentReversal.languageId = language;
        selectedLetter = currentAlphabet[0];
        const scrollableDiv = document.querySelector('.flex-1.overflow-y-auto.bg-base-100');
        if (scrollableDiv) {
            scrollableDiv.scrollTop = 0;
        }
    }

    let isFetching = false;

    async function checkIfScrolledToBottom(div: HTMLDivElement) {
        if (isFetching) return;

        if (
            (validReversal && currentReversal.words.length > 0) ||
            (currentReversal.languageId === vernacularLanguageId.value &&
                vernacularWords.value.length > 0)
        ) {
            const threshold = 100;

            if (div.scrollHeight - div.scrollTop - div.clientHeight < threshold) {
                const currentIndex = currentAlphabet.indexOf(selectedLetter);
                if (!currentReversal.letters.has(currentAlphabet[currentIndex + 1])) {
                    if (currentIndex < currentAlphabet.length - 1) {
                        isFetching = true;

                        isFetching = false;
                    }
                }
            } else if (
                (validReversal && currentReversal.letters.has(selectedLetter)) ||
                currentReversal.languageId === vernacularLanguageId.value
            ) {
                const allLetters = div.querySelectorAll('[id^="letter-"]');
                let visibleLetter = null;

                allLetters.forEach((letterDiv) => {
                    const rect = letterDiv.getBoundingClientRect();
                    if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
                        visibleLetter = letterDiv.id.split('-')[1];
                    }
                });

                if (visibleLetter) {
                    selectedLetter = visibleLetter;
                }
            }
        }
    }

    let currentAlphabet = $derived(validReversal ? alphabets.reversal : alphabets.vernacular);

    onMount(() => {
        if (config.programType !== 'DAB') {
            gotoRoute(`/text`);
        }
    });

    let previousLanguage = $state(currentReversal.languageId);
</script>

{#if selectedWord.value}
    <WordNavigationStrip />
{:else}
    {@const tabs = [vernacularLanguageId.value, ...reversals.keys()]}
    {@const indexOfPrevious = tabs.indexOf(previousLanguage)}
    <div class="flex w-full" style="background-color: var(--TabBackgroundColor);">
        {#each tabs as lang, i}
            <button
                aria-pressed={currentReversal.languageId === lang}
                onclick={() => {
                    previousLanguage = currentReversal.languageId;
                    switchLanguage(lang);
                }}
                class="py-2.5 px-3.5 text-sm uppercase text-center relative dy-tabs dy-tabs-bordered mb-1"
            >
                {displayNames.value[lang]}
                {#if currentReversal.languageId === lang}
                    <div
                        transition:fly={{ easing: expoInOut, x: 70 * (indexOfPrevious - i) }}
                        class="absolute -bottom-1 left-0 w-full h-1 bg-black"
                    ></div>
                {/if}
            </button>
        {/each}
        <div class="flex-1"></div>
    </div>

    <div
        class="flex m-2 gap-1 md:gap-2 mb-4 justify-start overflow-x-auto whitespace-nowrap pb-2 snap-x"
    >
        {#each currentAlphabet as letter}
            <button
                class="dy-btn dy-btn-square dy-btn-sm rounded-sm font-bold snap-start sm:text-base lg:text-lg"
                style="border-color: var(--SettingsSeparatorColor);"
                disabled={currentReversal.languageId !== vernacularLanguageId.value &&
                    !reversals
                        .get(currentReversal.languageId)
                        ?.get(letter)
                        ?.values()
                        .some((w) => w.length)}
                onclick={() => handleLetterChange(letter)}
            >
                {letter}
            </button>
        {/each}
    </div>
{/if}

<div
    class="flex-1 overflow-y-auto"
    bind:this={scrollContainer}
    onscroll={(e) => checkIfScrolledToBottom(e.currentTarget)}
>
    {#if selectedWord.value}
        <EntryView />
    {:else}
        {@const usingVernacular = currentReversal.languageId === vernacularLanguageId.value}
        {@const words = usingVernacular ? vernacularWords.value : currentReversal.words}
        <ul class="space-y-3 px-4 pb-4" style="color: var(--TextColor);">
            {#each words as word}
                <li class="cursor-pointer text-lg mb-3 scroll-mt-16" id="letter-{word.letter}">
                    <button
                        type="button"
                        class="w-full text-left py-1"
                        aria-label={`Select word ${word.name}`}
                        style="border-bottom: 1px solid var(--SettingsSeparatorColor);"
                        onclick={() => selectWord(word)}
                    >
                        <span class="font-bold break-words" lang={currentReversal.languageId}>
                            {word.name}<HomonymSubscript {word} />
                        </span>
                        {#if usingVernacular && isVernacular(word) && word.summary}
                            {@const matches = word.summary.match(/{(.*?)}/g) || []}
                            <p class="ml-4">
                                {#if matches.length}
                                    <span class="italic">
                                        {#each matches as match}
                                            {match.replace(/[{}]/g, '')}
                                        {/each}
                                    </span>
                                {/if}
                                {word.summary.replaceAll(/{(.*?)}/g, '')}
                            </p>
                        {:else if !isVernacular(word)}
                            <br />
                            <span class="ml-4">
                                {#each word.vernacularWords as ref, i}
                                    {#if i > 0},
                                    {/if}
                                    <span>
                                        {ref.name}<HomonymSubscript word={ref} />
                                    </span>
                                {/each}
                            </span>
                        {/if}
                    </button>
                </li>
            {/each}
        </ul>
    {/if}
</div>
