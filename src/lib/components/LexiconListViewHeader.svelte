<script>
    import LexiconAlphabetStrip from './LexiconAlphabetStrip.svelte';
    import LexiconLanguageTabs from './LexiconLanguageTabs.svelte';

    let {
        alphabet,
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

<LexiconLanguageTabs
    {reversalLanguage}
    {selectedLanguage}
    {onSwitchLanguage}
    {vernacularLanguage}
/>

<LexiconAlphabetStrip {alphabet} onLetterSelect={handleLetterSelect} />
