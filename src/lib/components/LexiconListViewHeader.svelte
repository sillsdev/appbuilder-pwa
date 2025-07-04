<script>
    import LexiconAlphabetStrip from './LexiconAlphabetStrip.svelte';
    import LexiconLanguageTabs from './LexiconLanguageTabs.svelte';

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

<LexiconLanguageTabs
    {reversalLanguage}
    {selectedLanguage}
    {onSwitchLanguage}
    {vernacularLanguage}
/>

<LexiconAlphabetStrip {alphabet} onLetterSelect={handleLetterSelect} />
