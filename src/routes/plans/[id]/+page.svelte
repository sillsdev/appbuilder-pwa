<script>
    import { page } from '$app/stores';
    import Navbar from '$lib/components/Navbar.svelte';

    import {
        language,
        s,
        t,
        convertStyle,
        themeColors,
        modal,
        MODAL_COLLECTION,
        MODAL_TEXT_APPERANCE,
        refs
    } from '$lib/data/stores';
    import { getLastPlanState } from '$lib/data/planStates';
    import { getDisplayString } from '$lib/scripts/scripture-reference-utils';
    import { getReferenceFromString } from '$lib/scripts/scripture-reference-utils-common';
    import { base } from '$app/paths';
    import { goto } from '$app/navigation';
    import config from '$lib/data/config';
    import { compareVersions } from '$lib/scripts/stringUtils';
    import { CalendarMonthIcon, CheckboxOutlineIcon, InfoIcon } from '$lib/icons';
    console.log('got to id page', $page.data);
    const imageFolder =
        compareVersions(config.programVersion, '12.0') < 0 ? 'illustrations' : 'plans';

    console.log('planData:', $page.data.planData);
    console.log('style: ', convertStyle($s['ui.plans.tabs.icon']));

    //need some way to know the status of the plan
    //for now assume it's from choose plans

    let selectedTab = 'info';
    let inUse = false;
    //could be info or calendar for a plan thats not in use, if the plan is in use, there is a settings tab
    getLastPlanState($page.data.planData.id)
        .then((planState) => {
            if (planState && planState === 'started') {
                selectedTab = 'calendar';
                inUse = true;
            }
        })
        .catch(console.error);
    let selectedDay = $page.data.planData.items[0];
    function checkSelection(day) {
        if (day === selectedDay) {
            return 'selected plan-day-box-selected';
        } else {
            return 'plan-day-box-unselected';
        }
    }
    function getReferenceString(ref) {
        // Reminder - get book collection id
        let currentBookCollectionId = $refs.collection;
        const [collection, book, fromChapter, toChapter, verseRanges] = getReferenceFromString(ref);
        const displayString = getDisplayString(
            currentBookCollectionId,
            book,
            toChapter,
            verseRanges
        );
        return displayString;
    }
</script>

<div class="grid grid-rows-[auto,1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar">
        <Navbar>
            <!-- <div slot="left-buttons" /> -->
            <label for="sidebar" slot="center">
                <div class="btn btn-ghost normal-case text-xl">
                    <!--back navigation isn't quite right-->
                    {$page.data.planConfig[$language] ?? $page.data.planConfig.default ?? ''}
                </div>
            </label>
            <!-- <div slot="right-buttons" class="flex items-center"> -->
        </Navbar>
    </div>

    <div class="overflow-y-auto mx-auto md:max-w-screen-md w-full">
        {#if $page.data.planConfig.image}
            <div>
                <img
                    class="plan-image"
                    src="{base}/{imageFolder}/{$page.data.planConfig.image.file}"
                    alt={$page.data.planConfig.image.file}
                    width={$page.data.planConfig.image.width}
                    height={$page.data.planConfig.image.height}
                />
            </div>
        {/if}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
            role="tablist"
            class="dy-tabs dy-tabs-bordered"
            style={convertStyle($s['ui.plans.tabs'])}
        >
            <!-- svelte-ignore a11y-no-static-element-interactions -->

            <div
                name="my_tabs_1"
                class="dy-tab dy-tab-bordered {selectedTab === 'info' ? 'dy-tab-active' : ''}"
                on:click={() => (selectedTab = 'info')}
                aria-label="info icon"
                style={convertStyle($s['ui.plans.tabs.text'])}
            >
                <InfoIcon style={convertStyle($s['ui.plans.tabs.icon'])}></InfoIcon>
            </div>

            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div
                name="my_tabs_1"
                class="dy-tab {selectedTab === 'calendar' ? 'dy-tab-active' : ''}"
                on:click={() => (selectedTab = 'calendar')}
                aria-label="calendar logo"
            >
                <CalendarMonthIcon style={convertStyle($s['ui.plans.tabs.icon'])}
                ></CalendarMonthIcon>
            </div>
        </div>

        <div id="container" class="plan-chooser">
            {#if selectedTab === 'info'}
                <div id="plan-page" class="plan-details">
                    <div class="plan-title">
                        {$page.data.planData.title[$language] ??
                            $page.data.planData.title.default ??
                            ''}
                    </div>
                    <div class="plan-days">
                        {$t['Plans_Number_Days'].replace('%d', $page.data.planConfig.days)}
                    </div>
                    <div class="plan-description">
                        {$page.data.planData.description[$language] ??
                            $page.data.planData.description.default ??
                            ''}
                    </div>
                    {#if inUse === true}
                        <div class="plan-button-block">
                            <div class="plan-button" id="PLAN-continue">
                                <button on:click={() => (selectedTab = 'calendar')}>
                                    {$t['Plans_Button_Continue_Reading']}
                                </button>
                            </div>
                        </div>
                    {:else}
                        <div class="plan-button-block">
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <!-- svelte-ignore a11y-no-static-element-interactions -->
                            <div class="plan-button" id="PLAN-start"
                                    on:click={() =>
                                        goto(`${base}/plans/${$page.data.planData.id}/settings`)}
                                >
                                    {$t['Plans_Button_Start_Plan']}
                            </div>
                        </div>
                    {/if}
                </div>
            {/if}
            {#if selectedTab === 'calendar'}
                <div class="plan-days-scroller" id="scroller">
                    <ul class="dy-menu-horizontal bg-base-200 rounded-box">
                        {#each $page.data.planData.items as item}
                            <!-- plan-day-box selected plan-day-box-selected plan-day-box-uncompleted or
                         plan-day-box plan-day-box-unselected plan-day-box-uncompleted -->
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <!-- svelte-ignore a11y-no-static-element-interactions -->
                            <!-- the class plan-day-box in particular does not seem to work-->
                            <li>
                                <div
                                    class="plan-day-box plan-day-box-uncompleted {selectedDay.day ===
                                    item.day
                                        ? 'selected plan-day-box-selected'
                                        : 'plan-day-box-unselected'}"
                                    id="D-1"
                                    on:click={() => (selectedDay = item)}
                                >
                                    <div class="plan-day-box-content">
                                        <div class="plan-day-box-weekday">{$t['Plans_Day']}</div>
                                        <div class="plan-day-box-number">{item.day}</div>
                                    </div>
                                </div>
                            </li>
                        {/each}
                    </ul>
                </div>

                <div class="plan-items" id="container">
                    <table class="plan-items-table">
                        <tbody>
                            {#each selectedDay.refs as ref, index}
                                <tr class="plan-item" id={'R-' + index}>
                                    <td class="plan-item-checkbox plan-checkbox-image">
                                        <CheckboxOutlineIcon />
                                    </td>
                                    <td class="plan-item-title">
                                        <span class="plan-item-reference"
                                            >{getReferenceString(ref)}</span
                                        >
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}
        </div>
    </div>
</div>
