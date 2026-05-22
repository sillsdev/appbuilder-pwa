<script lang="ts">
    import config from '$assets/config';
    import Navbar from '$lib/components/Navbar.svelte';
    import { getFirstIncompleteDay, getNextPlanReference } from '$lib/data/planProgressItems';
    import type { PlanDataItem } from '$lib/data/plansData';
    import { getLastPlanStateRecord } from '$lib/data/planStates';
    import { convertStyle, language, modal, ModalType, plan, refs, s, t } from '$lib/data/stores';
    import {
        CalendarMonthIcon,
        CheckboxIcon,
        CheckboxOutlineIcon,
        InfoIcon,
        SettingsIcon
    } from '$lib/icons';
    import { gotoRoute } from '$lib/navigate';
    import { getDisplayString } from '$lib/scripts/scripture-reference-utils';
    import { getReferenceFromString } from '$lib/scripts/scripture-reference-utils-common';
    import { compareVersions } from '$lib/scripts/stringUtils';
    import type { PageData } from './$types';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    const imageFolder: Record<string, string> =
        compareVersions(config.programVersion, '12.0') < 0
            ? import.meta.glob('./*', {
                  eager: true,
                  import: 'default',
                  query: '?url',
                  base: '/src/gen-assets/illustrations'
              })
            : import.meta.glob(['./*', '!./*.json'], {
                  eager: true,
                  import: 'default',
                  query: '?url',
                  base: '/src/gen-assets/plans'
              });

    const barIconColor = $s?.['ui.bar.text-select.icon']['color'];
    //need some way to know the status of the plan
    //for now assume it's from choose plans

    let selectedTab = $state('info');
    let inUse = $state(false);
    //could be info or calendar for a plan thats not in use, if the plan is in use, there is a settings tab
    checkPlanState();
    let selectedDay = $derived(data.planData.items?.[0]);
    const planId = $derived(data.planData.id);
    let currentPlanStatus = $state('');
    let currentStatusDateString = '';
    async function checkPlanState() {
        const planStateRecord = await getLastPlanStateRecord(data.planData.id);
        if (planStateRecord) {
            const planState = planStateRecord.state;
            currentPlanStatus = planState;
            const statusDate = new Date(planStateRecord.date);
            currentStatusDateString = statusDate.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            if (planState && planState === 'started') {
                selectedTab = 'calendar';
                inUse = true;
                const firstIncompletePlanDay = await getFirstIncompleteDay(data.planData, -1);
                if (firstIncompletePlanDay !== -1) {
                    // -1 means the plan is complete, which really shouldn't show up here
                    const dayIndex = data.planData.items?.findIndex(
                        (item) => item.day === firstIncompletePlanDay
                    );
                    // Should always be found but
                    if ((dayIndex ?? -1) !== -1) {
                        selectedDay = data.planData.items?.[dayIndex!];
                    }
                }
            }
        }
    }
    function referenceCompleted(day: number, refIndex: number) {
        let completed = false;
        // While there should only be 0 or one match, this will get any present
        const matchingEntries = data.planCompletionData.filter(
            (item) => item.day === day && item.itemIndex === refIndex
        );
        if (matchingEntries.length > 0) {
            completed = true;
        }
        return completed;
    }

    function getReferenceString(ref: string) {
        // Reminder - get book collection id
        let currentBookCollectionId = $refs.collection;
        const [_collection, book, _fromChapter, toChapter, verseRanges] =
            getReferenceFromString(ref);
        const displayString = getDisplayString(
            currentBookCollectionId,
            book,
            toChapter,
            verseRanges
        );
        return displayString;
    }

    function checkReference(book: string, chapter: number) {
        let value = false;
        const books = $refs.catalog.documents;
        const bookInCatalog = books.find((d) => d.bookCode === book);
        const chaptersInBook = bookInCatalog?.versesByChapters ?? [];
        const chapterInBook = Object.keys(chaptersInBook).find((x) => x === chapter.toString());
        if (bookInCatalog && chapterInBook) {
            value = true;
        }
        return value;
    }
    function goToDailyReference(item: PlanDataItem, ref: string, index: number) {
        // Only go to reference if in an active plan
        if (inUse) {
            let currentBookCollectionId = $refs.collection;
            const [collection, book, fromChapter, toChapter, verseRanges] =
                getReferenceFromString(ref);
            const [fromVerse, toVerse, separator] = verseRanges[0];
            if (checkReference(book, toChapter)) {
                let destinationVerse = fromVerse === -1 ? 1 : fromVerse;
                getNextPlanReference(data.planData.id, item, index).then(
                    ([nextReference, nextIndex]) => {
                        $plan = {
                            planId: data.planData.id,
                            planDay: item.day,
                            planEntry: index,
                            planBookId: book,
                            planChapter: toChapter,
                            planFromVerse: fromVerse,
                            planToVerse: toVerse,
                            planReference: ref,
                            planNextReference: nextReference,
                            planNextReferenceIndex: nextIndex,
                            completed: false
                        };
                        refs.set({
                            docSet: currentBookCollectionId,
                            book: book,
                            chapter: toChapter.toString(),
                            verse: destinationVerse.toString()
                        });
                        gotoRoute(`/text`);
                    }
                );
            }
        }
    }
    function backNavigation() {
        gotoRoute(`/plans`);
    }

    function buildStatusDateString() {
        let result = '';
        if (currentPlanStatus === 'started') {
            const formatString = $t['Plans_Date_Started'];
            result = formatString.replace('%s', currentStatusDateString);
        } else if (currentPlanStatus === 'completed') {
            const formatString = $t['Plans_Date_Completed'];
            result = formatString.replace('%s', currentStatusDateString);
        }
        return result;
    }

    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;
    let scroller: HTMLDivElement | undefined = $state();

    function handleMouseDown(event: MouseEvent) {
        isDragging = true;
        if (scroller) {
            startX = event.pageX - scroller.offsetLeft;
            scrollLeft = scroller.scrollLeft;
        }
    }

    function handleMouseMove(event: MouseEvent) {
        if (!isDragging) {
            return;
        }
        event.preventDefault();
        if (scroller) {
            const x = event.pageX - scroller.offsetLeft;
            const walk = (x - startX) * 2; // Adjust scroll speed
            scroller.scrollLeft = scrollLeft - walk;
        }
    }

    function handleMouseUp() {
        isDragging = false;
    }
</script>

<div class="grid grid-rows-[auto,1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar">
        <Navbar {backNavigation}>
            {#snippet center()}
                <label for="sidebar">
                    <div class="btn btn-ghost normal-case text-xl">
                        <!--back navigation isn't quite right-->
                        {data.planConfig?.title[$language] ?? data.planConfig?.title.default ?? ''}
                    </div>
                </label>
            {/snippet}
        </Navbar>
    </div>

    <div class="overflow-y-auto mx-auto md:max-w-screen-md w-full">
        {#if data.planConfig?.image}
            <div>
                <img
                    class="plan-image"
                    src={imageFolder[`./${data.planConfig.image.file}`]}
                    alt={data.planConfig.image.file}
                    width={data.planConfig.image.width}
                    height={data.planConfig.image.height}
                />
            </div>
        {/if}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
            role="tablist"
            class="dy-tabs dy-tabs-bordered"
            style={convertStyle($s?.['ui.plans.tabs'])}
        >
            <!-- svelte-ignore a11y_no_static_element_interactions -->

            <div
                class="dy-tab dy-tab-bordered {selectedTab === 'info' ? 'dy-tab-active' : ''}"
                onclick={() => (selectedTab = 'info')}
                aria-label="info icon"
                style={convertStyle($s?.['ui.plans.tabs.text'])}
            >
                <InfoIcon color={barIconColor} style={convertStyle($s?.['ui.plans.tabs.icon'])} />
            </div>

            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="dy-tab {selectedTab === 'calendar' ? 'dy-tab-active' : ''}"
                onclick={() => (selectedTab = 'calendar')}
                aria-label="calendar logo"
            >
                <CalendarMonthIcon
                    color={barIconColor}
                    style={convertStyle($s?.['ui.plans.tabs.icon'])}
                />
            </div>
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            {#if inUse}
                <div
                    class="dy-tab {selectedTab === 'settings' ? 'dy-tab-active' : ''}"
                    onclick={() => (selectedTab = 'settings')}
                    aria-label="settings icon"
                >
                    <SettingsIcon
                        color={barIconColor}
                        style={convertStyle($s?.['ui.plans.tabs.icon'])}
                    />
                </div>
            {/if}
        </div>

        <div id="container" class="plan-chooser">
            {#if selectedTab === 'info'}
                <div id="plan-page" class="plan-details">
                    <div class="plan-title">
                        {data.planData.title?.[$language] ?? data.planData.title?.default ?? ''}
                    </div>
                    <div class="plan-days">
                        {$t['Plans_Number_Days'].replace('%d', String(data.planConfig?.days ?? ''))}
                    </div>
                    <div class="plan-description">
                        {data.planData.description?.[$language] ??
                            data.planData.description?.default ??
                            ''}
                    </div>
                    {#if currentPlanStatus === 'started' || currentPlanStatus === 'completed'}
                        <div class="plan-state-and-date">
                            {buildStatusDateString()}
                        </div>
                    {/if}
                    {#if inUse === true}
                        <div class="plan-button-block">
                            <div class="plan-button" id="PLAN-continue">
                                <button onclick={() => (selectedTab = 'calendar')}>
                                    {$t['Plans_Button_Continue_Reading']}
                                </button>
                            </div>
                        </div>
                    {:else}
                        <div class="plan-button-block">
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                            <div
                                class="plan-button"
                                id="PLAN-start"
                                onclick={() => gotoRoute(`/plans/${data.planData.id}/settings`)}
                            >
                                {$t['Plans_Button_Start_Plan']}
                            </div>
                        </div>
                    {/if}
                </div>
            {/if}
            {#if selectedTab === 'calendar'}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                    class="plan-days-scroller"
                    id="scroller"
                    bind:this={scroller}
                    onmousedown={handleMouseDown}
                    onmousemove={handleMouseMove}
                    onmouseup={handleMouseUp}
                    onmouseleave={handleMouseUp}
                >
                    <ul class="dy-menu-horizontal bg-base-200 rounded-box">
                        {#each data.planData.items as item}
                            <!-- plan-day-box selected plan-day-box-selected plan-day-box-uncompleted or
                         plan-day-box plan-day-box-unselected plan-day-box-uncompleted -->
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                            <!-- the class plan-day-box in particular does not seem to work-->
                            <li>
                                <div
                                    class="plan-day-box plan-day-box-uncompleted {selectedDay?.day ===
                                    item.day
                                        ? 'selected plan-day-box-selected'
                                        : 'plan-day-box-unselected'}"
                                    id="D-1"
                                    onclick={() => (selectedDay = item)}
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
                            {#each selectedDay?.refs as ref, index}
                                <tr
                                    class="plan-item"
                                    id={'R-' + index}
                                    onclick={() =>
                                        selectedDay && goToDailyReference(selectedDay, ref, index)}
                                >
                                    <td class="plan-item-checkbox plan-checkbox-image">
                                        {#if referenceCompleted(selectedDay!.day, index) === true}
                                            <CheckboxIcon color={barIconColor} />
                                        {:else}
                                            <CheckboxOutlineIcon color={barIconColor} />
                                        {/if}
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
            {#if selectedTab === 'settings'}
                <div id="container" class="plan-config">
                    <div class="plan-config-info">
                        {$t['Plans_Config_Stop_Plan_info']}
                    </div>
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div
                        class="plan-button plan-config-button"
                        id="PLAN-stop"
                        onclick={() => modal.open(ModalType.StopPlan, planId)}
                    >
                        {$t['Plans_Button_Stop_Plan']}
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .plan-days-scroller {
        user-select: none;
        -webkit-user-select: none;
        -ms-user-select: none;
        cursor: grab; /* Change cursor to indicate draggable area */
    }

    .plan-days-scroller:active {
        cursor: grabbing; /* While dragging */
    }
</style>
