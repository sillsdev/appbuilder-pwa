<!--
@component
-->
<script>
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';
    import config from '$lib/data/config';
    import contents from '$lib/data/contents';
    import { language, languageDefault, refs, s, theme } from '$lib/data/stores';
    import { getRoute } from '$lib/navigate';

    export let barType = undefined;

    const bottomNavBarItems = config?.bottomNavBarItems;

    $: barBackgroundColor = $s['ui.bottom-navigation.']['background-color'];
    $: barTextColor = $s['ui.bottom-navigation.item.text']['color'];
    $: barTextSelectedColor = $s['ui.bottom-navigation.item.text.selected']['color'];

    const showContents = contents.screens?.length > 0;
    const showSearch = config.mainFeatures['search'];
    const showPlans = config.plans?.plans.length > 0;

    function showButton(buttonType) {
        let value = true;
        switch (buttonType) {
            case 'contents':
                value = showContents;
                break;
            case 'plans':
                value = showPlans;
                break;
            case 'search':
                value = showSearch;
                break;
            default:
                value = true;
        }
        return value;
    }
    function selectedLink(buttonType, link) {
        let value = buttonType === barType;
        if (buttonType === 'book') {
            // Don't highlight link for specific book
            if (link && link !== '') {
                value = false;
            }
        }
        return value;
    }
    function gridColumns() {
        let value = 'grid-cols-5';
        if (bottomNavBarItems) {
            switch (bottomNavBarItems.length) {
                case 2:
                    value = 'grid-cols-2';
                    break;
                case 3:
                    value = 'grid-cols-3';
                    break;
                case 4:
                    value = 'grid-cols-4';
                    break;
                default:
                    value = 'grid-cols-5';
            }
        }
        return value;
    }
    function handleClick(buttonType, link) {
        switch (buttonType) {
            case 'contents':
                let gotoLink = link && link !== '' ? link : '1';
                goto(getRoute(`/contents/${gotoLink}`));
                break;
            case 'about':
                goto(getRoute('/about'));
                break;
            case 'book':
                if (link && link !== '') {
                    const [bc, book] = link.split('|');
                    const refBc = config.bookCollections.find((x) => x.id === bc);
                    let refDocSet = '';
                    if (refBc) {
                        refDocSet = refBc.languageCode + '_' + refBc.id;
                    } else {
                        // Invalid collection
                        return;
                    }
                    refs.set({
                        docSet: refDocSet,
                        book: book,
                        chapter: '1',
                        verse: '1'
                    });
                }
                goto(getRoute('/text'));
                break;
            case 'plans':
                goto(getRoute('/plans'));
                break;
            case 'search':
                goto(getRoute(`/search/${$refs.collection}`));
                break;
            case 'settings':
                goto(getRoute('/settings'));
                break;
            default:
                console.log(
                    'BottomNavigation Bar: Unknown NavBar button type pressed: ',
                    buttonType
                );
                break;
        }
    }
</script>

<div class="h-16" style:background-color={barBackgroundColor}>
    <div class="mx-auto max-w-screen-md">
        <div class="grid {gridColumns()} justify-items-center">
            <!-- Controls -->
            {#if bottomNavBarItems}
                {#each bottomNavBarItems as item}
                    {#if showButton(item.type)}
                        <button
                            class="dy-btn dy-btn-ghost flex-col gap-1 my-2"
                            onclick={() => handleClick(item.type, item.link['default'])}
                        >
                            <picture class:invert={$theme === 'Dark'}>
                                <!-- Image Icon -->
                                <img
                                    src="{base}/icons/menu-items/{item.images[0].file}"
                                    alt=""
                                    class={selectedLink(item.type, item.link['default'])
                                        ? 'opacity-100'
                                        : 'opacity-50'}
                                />
                            </picture>
                            <!-- Text -->
                            <span
                                class="text-center"
                                style="color: {selectedLink(item.type, item.link['default'])
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
