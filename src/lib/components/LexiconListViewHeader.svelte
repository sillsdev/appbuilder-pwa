<script>
    import LexiconAlphabetStrip from './LexiconAlphabetStrip.svelte';
    import LexiconLanguageTabs from './LexiconLanguageTabs.svelte';

    export let alphabet = [];
    export let selectedLanguage;
    export let vernacularLanguage;
    export let reversalLanguage;
    export let selectedLetter;
    export let onSwitchLanguage;
    export let onLetterChange;

    let currentLetter = alphabet[0];

    async function handleLetterSelect(letter) {
        currentLetter = letter;
        onLetterChange(letter);
    }

    $: if (alphabet && alphabet.length > 0) {
        currentLetter = alphabet[0];
    }
    $: if (selectedLetter !== currentLetter) {
        currentLetter = selectedLetter;
    }
</script>

<LexiconLanguageTabs
    {reversalLanguage}
    {selectedLanguage}
    {onSwitchLanguage}
    {vernacularLanguage}
/>

<LexiconAlphabetStrip {alphabet} activeLetter={currentLetter} onLetterSelect={handleLetterSelect} />
