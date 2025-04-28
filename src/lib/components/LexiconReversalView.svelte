<script>
    import AlphabetStrip from './AlphabetStrip.svelte';
    import LexiconLanguageTabs from './LexiconLanguageTabs.svelte';

    export let alphabet = [];
    export let initialData = {};
    export let selectedLanguage;
    export let vernacularLanguage;
    export let reversalLanguages = [];
    export let selectedLetter;
    export let onSwitchLanguage;
    export let onLetterChange;

    let currentLetter = alphabet[0];
    let reversalData = initialData;
    let loading = false;

    async function loadReversalData(letter) {
        if (
            letter === alphabet[0] &&
            Object.keys(initialData).length > 0 &&
            selectedLanguage === vernacularLanguage
        ) {
            reversalData = initialData;
            return;
        }
        loading = true;
        // Logic to load data for the selected letter
    }

    async function handleLetterSelect(letter) {
        currentLetter = letter;
        onLetterChange(letter);
        await loadReversalData(letter);
    }

    $: if (alphabet.length > 0 && !currentLetter) {
        currentLetter = alphabet[0]; // Set the first letter if currentLetter is undefined
    }

    $: if (selectedLetter && selectedLetter !== currentLetter) {
        currentLetter = selectedLetter; // Sync with selectedLetter prop
    }
</script>

<div class="flex flex-col h-full">
    <LexiconLanguageTabs
        {reversalLanguages}
        {selectedLanguage}
        {onSwitchLanguage}
        {vernacularLanguage}
    />

    <AlphabetStrip
        {alphabet}
        activeLetter={currentLetter}
        onLetterSelect={handleLetterSelect}
    />
</div>
