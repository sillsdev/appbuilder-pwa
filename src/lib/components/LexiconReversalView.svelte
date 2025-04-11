<script>
    import AlphabetStrip from './AlphabetStrip.svelte';
    import LexiconLanguageTabs from './LexiconLanguageTabs.svelte';

    export let alphabet = [];
    export let initialData = {};
    export let selectedLanguage;
    export let vernacularLanguage;
    export let reversalLanguage;
    export let selectedLetter;
    export let onSwitchLanguage;
    export let onLetterChange;

    let currentLetter = alphabet[0];
    let reversalData = initialData;
    let loading = false;

    async function loadReversalData(letter) {
        if (letter === alphabet[0] && Object.keys(initialData).length > 0) {
            reversalData = initialData;
            return;
        }

        loading = true;
    }

    async function handleLetterSelect(letter) {
        currentLetter = letter;
        onLetterChange(letter);
        await loadReversalData(letter);
    }

    $: if (alphabet && alphabet.length > 0) {
        currentLetter = alphabet[0];
    }
    $: if (selectedLetter !== currentLetter) {
        currentLetter = selectedLetter;
    }
</script>

<div class="flex flex-col">
    <LexiconLanguageTabs
        {reversalLanguage}
        {selectedLanguage}
        {onSwitchLanguage}
        {vernacularLanguage}
    />

    <AlphabetStrip {alphabet} activeLetter={currentLetter} onLetterSelect={handleLetterSelect} />
</div>
