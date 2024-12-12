<!--
@component
Based on an audio component found at https://svelte.dev/repl/b0a901d9a15347bd95466150485e4a78?version=3.31.0.
Wraps a JS-created HTMLAudioElement with a basic UI with a progress bar and Play/Pause, Seek, and Skip functionality.  
TODO:
- display audio not found message in UI when audio is not found
-->
<script>
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';
    import config from '$lib/data/config';
    import { refs, s, language, languageDefault, theme } from '$lib/data/stores';
    import { castToNavButtonType, NavButtonType } from '$lib/scripts/bottomNavButtonType';
    import  contents from '$lib/data/contents';

    export let barType = undefined;

    const bottomNavBarItems = config?.bottomNavBarItems;

    $: barBackgroundColor = $s['ui.bottom-navigation.']['background-color'];
    $: barIconColor = $s['ui.bottom-navigation.item.icon']['color'];
    $: barIconSelectedColor = $s['ui.bottom-navigation.item.icon.selected']['color'];
    $: barTextColor = $s['ui.bottom-navigation.item.text']['color'];
    $: barTextSelectedColor = $s['ui.bottom-navigation.item.text.selected']['color'];
    $: paneLineColor = $s['ui.pane-separator-line']['color'];

    const showContents = contents.screens?.length > 0;
    const showSearch = config.mainFeatures['search'];
    const showPlans = config.plans?.plans.length > 0;

    function showButton(buttonType) {
        let value = true;
        switch (buttonType) {
            case NavButtonType.Contents:
                value = showContents;
                break;
            case NavButtonType.Plans:
                value = showPlans;
                break;
            case NavButtonType.Search:
                value = showSearch;
                break;
            default:
                value = true;
        }
        return value;
    }

    function handleClick(buttonType, link) {
        switch (buttonType) {
            case NavButtonType.Contents:
                let gotoLink = link && link !== '' ? link : '1';
                goto(`${base}/contents/${gotoLink}`);
                break;
            case NavButtonType.About:
                goto(`${base}/about`);
                break;
            case NavButtonType.Bible:
                if (link && link !== '') {
                    const [bc, book] = link.split('|');
                    refs.set({
                        docSet: bc,
                        book: book,
                        chapter: '1',
                        verse: '1'
                    });
                }
                goto(`${base}/text`);
                break;
            case NavButtonType.Plans:
                goto(`${base}/plans`);
                break;
            case NavButtonType.Search:
                goto(`${base}/search/${$refs.collection}`);
                break;
            case NavButtonType.Settings:
                goto(`${base}/settings`);
                break;
            default:
                console.log('BottomNavigation Bar: Unknown NavBar button type pressed', buttonType);
                break;
        }
    }
</script>

<div class="h-16 bg-base-100 mx-auto" style:background-color={barBackgroundColor}>
    <div class="flex justify-center flex-grow">
        <!-- Controls -->
        <div class="dy-btn-group">
            {#if bottomNavBarItems}
                {#each bottomNavBarItems as item}
                    {#if showButton(castToNavButtonType(item.type))}
                        <button
                            class="dy-btn dy-btn-ghost flex-col gap-0"
                            style="margin: 0.5rem 0; "
                            on:click={() =>
                                handleClick(castToNavButtonType(item.type), item.link['default'])}
                        >
                            <picture class:invert={$theme === 'Dark'}>
                                <!-- Image Icon -->
                                <img
                                    src="{base}/icons/menu-items/{item.images[0].file}"
                                    alt="Home Icon"
                                    class="dy-w-10 dy-h-10 {barType === item.type
                                        ? 'opacity-100'
                                        : 'opacity-50'}"
                                />
                            </picture>
                            <!-- Text -->
                            <span
                                class="dy-text-center"
                                style="color: {barType === item.type
                                    ? barTextSelectedColor
                                    : barTextColor}"
                            >
                                {item.title[$language] || item.title[languageDefault]}
                            </span>
                        </button>
                    {/if}
                {/each}
            {/if}
        </div>
    </div>
</div>
