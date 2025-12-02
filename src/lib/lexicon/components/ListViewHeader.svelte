<script lang="ts">
    import AlphabetStrip from '$lib/lexicon/components/AlphabetStrip.svelte';
    import LanguageTabs from '$lib/lexicon/components/LanguageTabs.svelte';

    interface Props {
        alphabet: string[];
        selectedLanguage: string;
        vernacularLanguage: string;
        reversalLanguage: string;
        onSwitchLanguage: (lang: string) => void;
        onLetterChange: (letter: string) => void;
    }

    let {
        alphabet = [],
        selectedLanguage,
        vernacularLanguage,
        reversalLanguage,
        onSwitchLanguage,
        onLetterChange
    }: Props = $props();

    async function handleLetterSelect(letter: string) {
        onLetterChange(letter);
    }
</script>

<LanguageTabs {reversalLanguage} {selectedLanguage} {onSwitchLanguage} {vernacularLanguage} />

<AlphabetStrip {alphabet} onLetterSelect={handleLetterSelect} />
