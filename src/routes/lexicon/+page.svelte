<script>
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';
    import { page } from '$app/stores';
    import LexiconReversalView from '$lib/components/LexiconReversalView.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import config from '$lib/data/config';
    import { t } from '$lib/data/stores';
    import { onMount } from 'svelte';

    const { alphabet, initialReversalData, reversalLanguage, dictionaryName } = $page.data;

    // Hardcode both alphabets
    const alphabets = {
        english: [
            'a',
            'b',
            'c',
            'd',
            'e',
            'f',
            'g',
            'h',
            'i',
            'j',
            'k',
            'l',
            'm',
            'n',
            'o',
            'p',
            'q',
            'r',
            's',
            't',
            'u',
            'v',
            'w',
            'x',
            'y',
            'z'
        ],
        hanga: alphabet // Use the loaded Hanga alphabet
    };

    // Global array to store all words
    let allWords = [];

    /*/ Function to import all words from JSON files
    async function importWords() {
        const folderPath = path.resolve('static/reversal/en');

        try {
            // Read all files in the folder
            const files = fs.readdirSync(folderPath);

            // Filter to only include JSON files
            const jsonFiles = files.filter((file) => file.endsWith('.json'));

            // Loop through each JSON file
            for (const file of jsonFiles) {
                const filePath = path.join(folderPath, file);
                const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

                // Loop through each word in the JSON file
                for (const word in data) {
                    data[word].forEach((entry) => {
                        allWords.push({ index: entry.index, name: entry.name });
                    });
                }
            }

            // Print all words
            console.log(allWords);
        } catch (error) {
            console.error(`Error reading files in folder ${folderPath}:`, error);
        }
    }*/
    onMount(() => {
        //importWords();
        if (config.programType !== 'DAB') {
            goto(`${base}/text`);
        }
    });

    let selectedLanguage = 'English';
    let reversalLang = reversalLanguage;

    let currentLetter = '';

    function handleLetterChange(letter) {
        currentLetter = letter;
    }

    function switchLanguage(language) {
        selectedLanguage = language;
    }

    // Reactive to get the current alphabet based on selected language
    $: currentAlphabet = selectedLanguage === 'English' ? alphabets.english : alphabets.hanga;
</script>

<Navbar>
    <label for="sidebar" slot="center" class="navbar">
        <div class="btn btn-ghost normal-case text-xl text-white font-bold">
            {dictionaryName}
        </div>
    </label>
</Navbar>

<div class="flex flex-col">
    <LexiconReversalView
        alphabet={currentAlphabet}
        {initialReversalData}
        {selectedLanguage}
        {reversalLang}
        onSwitchLanguage={switchLanguage}
        onLetterChange={handleLetterChange}
    />
</div>

<h2>Current Letter: {currentLetter}</h2>

<!--<div class="entry"><span class="mainheadword"><span lang="hag-Latn-GH-fonipa-x-emic"><span lang="hag-Latn-GH-fonipa-x-emic"><a href="E-0">-a</a></span><span lang="hag-Latn-GH-fonipa-x-emic" style="font-weight:bold;font-size:58%;position:relative;top:0.3em;"><a href="E-0">1</a></span></span></span><span class="senses"><span class="sensecontent"><span class="sensenumber">1</span><span class="sense"><span class="morphosyntaxanalysis"><span class="partofspeech"><span lang="en">V > N</span></span><span class="morphtypes"><span class="morphtype"><span class="abbreviation"><span lang="en">sfx</span></span></span></span></span><span class="definitionorgloss"><span lang="en">nominalizes a verb</span></span></span></span><span class="sensecontent"><span class="sensenumber">2</span><span class="sense"><span class="morphosyntaxanalysis"><span class="partofspeech"><span lang="en">Nom > N</span></span><span class="morphtypes"><span class="morphtype"><span class="abbreviation"><span lang="en">sfx</span></span></span></span></span><span class="definitionorgloss"><span lang="en">forms a noun from a noun root</span></span></span></span></span></div>-->
