<!--
@component
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import config, { scriptureConfig } from '$assets/config';
    import contents from '$assets/contents';
    import { language, languageDefault, refs, s, theme, themeIsDark } from '$lib/data/stores';
    import { resolve } from '$lib/utils/paths';

    const menuIcons = import.meta.glob('./*', {
        import: 'default',
        eager: true,
        query: '?url',
        base: '/src/gen-assets/icons/menu-items'
    }) as Record<string, string>;

    let { barType = undefined } = $props();

    const bottomNavBarItems = config?.bottomNavBarItems;

    const barBackgroundColor = $derived(
        ($s?.['ui.bottom-navigation.bar'] ?? $s?.['ui.bottom-navigation.'])?.['background-color']
    );
    const barTextColor = $derived($s?.['ui.bottom-navigation.item.text']['color']);
    const barTextSelectedColor = $derived($s?.['ui.bottom-navigation.item.text.selected']['color']);

    const showContents = (contents.screens?.length ?? 0) > 0;
    const showSearch = config.mainFeatures['search'] as boolean;
    const showPlans = (scriptureConfig.plans?.plans.length ?? 0) > 0;

    function showButton(buttonType: string) {
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
    function selectedLink(buttonType: string, link?: string) {
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
    function handleClick(buttonType: string, link?: string) {
        switch (buttonType) {
            case 'contents': {
                let gotoLink = link && link !== '' ? link : '1';
                goto(resolve(`/contents/${gotoLink}`));
                break;
            }
            case 'about':
                goto(resolve(`/about`));
                break;
            case 'book':
                if (link && link !== '') {
                    const [bc, book] = link.split('|');
                    const refBc = scriptureConfig.bookCollections?.find((x) => x.id === bc);
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
                goto(resolve(`/text`));
                break;
            case 'plans':
                goto(resolve(`/plans`));
                break;
            case 'search':
                goto(resolve(`/search/${$refs.collection}`));
                break;
            case 'settings':
                goto(resolve(`/settings`));
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
    <div class="mx-auto max-w-breakpoint-md">
        <div class="grid {gridColumns()} justify-items-center">
            <!-- Controls -->
            {#if bottomNavBarItems}
                {#each bottomNavBarItems as item}
                    {#if showButton(item.type)}
                        <button
                            class="dy-btn dy-btn-ghost flex-col gap-1 my-2"
                            onclick={() => handleClick(item.type, item.link?.['default'])}
                        >
                            <picture class:invert={themeIsDark($theme)}>
                                <!-- Image Icon -->
                                <div
                                    style={`width:24px; height:24px; background: ${
                                        selectedLink(item.type, item.link?.['default'])
                                            ? barTextSelectedColor
                                            : barTextColor
                                    }; mask: url(${menuIcons[`./${item.images?.[0]?.file}`]}); -webkit-mask: url(${menuIcons[`./${item.images?.[0]?.file}`]});`}
                                    class={selectedLink(item.type, item.link?.['default'])
                                        ? 'opacity-100'
                                        : 'opacity-50'}
                                ></div>
                            </picture>
                            <!-- Text -->
                            <span
                                class="text-center"
                                style="font-family: system-ui; color: {selectedLink(
                                    item.type,
                                    item.link?.['default']
                                )
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
