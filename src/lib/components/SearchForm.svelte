<script lang="ts">
    import config from '$lib/data/config';
    import { convertStyle, s, t, themeColors } from '$lib/data/stores';
    import { SearchIcon } from '$lib/icons';
    import type { SearchFormSubmitEvent } from '$lib/types';

    interface SearchFormProps {
        phrase: string;
        wholeWords: boolean;
        matchAccents: boolean;
        submit: (event: SearchFormSubmitEvent) => void;
    }

    let { phrase, wholeWords, matchAccents, submit }: SearchFormProps = $props();

    let searchbar: HTMLInputElement | undefined = $state(undefined);

    // const specialCharacters =
    //     config.mainFeatures['input-buttons']?.split(' ').filter((c) => c.length) ?? [];

    let specialCharacters: string[] = $state([]);
    if (config.programType == 'SAB') {
        specialCharacters =
            config.mainFeatures['input-buttons']?.split(' ').filter((c) => c.length) ?? [];
    } else if (config.programType === 'DAB') {
        specialCharacters = Object.values(config.writingSystems)
            .filter((ws: any) => ws.type && ws.type.includes('main'))
            .flatMap((ws: any) => ws.inputButtons || []);
    }

    function addSpecialCharacter(char: string, event: MouseEvent) {
        event.preventDefault();
        const startPos = searchbar.selectionStart;
        const endPos = searchbar.selectionEnd;
        phrase = phrase.slice(0, startPos) + char + phrase.slice(endPos);
        // Update the input value and maintain focus
        searchbar.focus();
        requestAnimationFrame(() =>
            searchbar.setSelectionRange(startPos + char.length, startPos + char.length)
        );
    }

    let dismissSearchBar: boolean = $state(false);

    function doSubmit(event: Event) {
        event.preventDefault();
        if (!phrase) return;
        // Dismiss the search bar by disabling it.
        // Then re-enable the search bar to allow the user to modify the query.
        dismissSearchBar = true;
        setTimeout(() => {
            dismissSearchBar = false;
        }, 50);
        submit({ phrase, wholeWords, matchAccents });
    }
</script>

<form class="w-full max-w-screen-md p-4" style="background-color: var(--BackgroundColor);">
    <div class="dy-form-control mb-4">
        <label class="dy-input-group w-full flex">
            <input
                id="searchbar"
                bind:this={searchbar}
                readonly={dismissSearchBar}
                type="text"
                placeholder={$t['Search_Text_Hint']}
                class="flex-grow px-4 py-2 mx-2 dy-input min-w-0 dy-input-bordered"
                style:min-width="0"
                style={convertStyle($s['ui.search.entry-text'])}
                style:background-color="var(--PopupBackgroundColor)"
                style:color="var(--SearchTextColor)"
                style:border-color="var(--SettingsSeparatorColor)"
                size="1"
                inputmode="search"
                enterkeyhint="search"
                bind:value={phrase}
            />
            <button
                onclick={doSubmit}
                class="dy-btn mx-2 flex-none"
                style={convertStyle($s['ui.search.button'])}
                style:background-color="var(--SearchButtonColor)"
                style:color="var(--SearchButtonTextColor)"
                style:border-color="var(--SettingsSeparatorColor)"
            >
                <SearchIcon color="var(--SearchButtonTextColor)" />
            </button>
        </label>
    </div>
    {#if (config.mainFeatures['search-input-buttons'] || config.programType == 'DAB') && specialCharacters.length > 0}
        <div class="dy-form-control m-2">
            <div class="special-characters flex flex-wrap">
                {#each specialCharacters as character}
                    <button
                        class="m-0.5 rounded w-8 h-10"
                        style={convertStyle($s['ui.search.buttons'])}
                        style:background-color="var(--TabBackgroundColor)"
                        style:color="var(--TextColor)"
                        onclick={(e) => addSpecialCharacter(character, e)}
                    >
                        {character}
                    </button>
                {/each}
            </div>
        </div>
    {/if}
    {#if config.mainFeatures['search-whole-words-show'] || config.programType == 'DAB'}
        <div class="dy-form-control max-w-xs px-4 my-2">
            <label class="dy-label cursor-pointer">
                <span
                    class="dy-label-text"
                    style={convertStyle($s['ui.search.checkbox'])}
                    style:color="var(--SettingsSummaryColor)"
                >
                    <bdi>{$t['Search_Match_Whole_Words']}</bdi>
                </span>
                <input
                    type="checkbox"
                    class="dy-toggle"
                    bind:checked={wholeWords}
                    style:background-color="var(--TextHighlightColor)"
                    style:border-color="var(--SettingsSeparatorColor)"
                />
            </label>
        </div>
    {/if}
    {#if config.mainFeatures['search-accents-show'] || config.programType == 'DAB'}
        <div class="dy-form-control max-w-xs px-4 my-2">
            <label class="dy-label cursor-pointer">
                <span
                    class="dy-label-text"
                    style={convertStyle($s['ui.search.checkbox'])}
                    style:color="var(--SettingsSummaryColor)"
                >
                    <bdi>{$t['Search_Match_Accents']}</bdi>
                </span>
                <input
                    type="checkbox"
                    class="dy-toggle"
                    bind:checked={matchAccents}
                    style:background-color="var(--TextHighlightColor)"
                    style:border-color="var(--SettingsSeparatorColor)"
                />
            </label>
        </div>
    {/if}
</form>
