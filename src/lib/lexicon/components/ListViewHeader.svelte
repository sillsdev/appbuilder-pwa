<script>
    import AlphabetStrip from '$lib/lexicon/components/AlphabetStrip.svelte';
    import LanguageTabs from '$lib/lexicon/components/LanguageTabs.svelte';

    export let alphabet = [];
    export let selectedLanguage;
    export let vernacularLanguage;
    export let reversalLanguage;
    export let onSwitchLanguage;
    export let onLetterChange;

    async function handleLetterSelect(letter) {
        onLetterChange(letter);
    }
</script>

<LanguageTabs {reversalLanguage} {selectedLanguage} {onSwitchLanguage} {vernacularLanguage} />

<AlphabetStrip {alphabet} onLetterSelect={handleLetterSelect} />
