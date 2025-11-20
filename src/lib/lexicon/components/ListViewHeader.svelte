<script>
    import AlphabetStrip from '$lib/lexicon/components/AlphabetStrip.svelte';
    import LanguageTabs from '$lib/lexicon/components/LanguageTabs.svelte';

    let {
        alphabet = [],
        selectedLanguage,
        vernacularLanguage,
        reversalLanguage,
        onSwitchLanguage,
        onLetterChange
    } = $props();

    async function handleLetterSelect(letter) {
        onLetterChange(letter);
    }
</script>

<LanguageTabs {reversalLanguage} {selectedLanguage} {onSwitchLanguage} {vernacularLanguage} />

<AlphabetStrip {alphabet} onLetterSelect={handleLetterSelect} />
