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
        MODAL_TEXT_APPEARANCE
    } from '$lib/data/stores';
    import { base } from '$app/paths';
    import config from '$lib/data/config';
    import { getLastPlanState } from '$lib/data/planStates';
    import { compareVersions } from '$lib/scripts/stringUtils';
    import { goto } from '$app/navigation';

    console.log('Config Plans', config.plans.plans); //all plans options
    console.log('Data Plans', $page.data.plans); //your plans

    const imageFolder =
        compareVersions(config.programVersion, '12.0') < 0 ? 'illustrations' : 'plans';

    //filter out the ones that are in $data.plans, looking at id
    // $: availablePlans =
    // //what plans are viewed based on what tab is selected
    // $: viewedPlans =

    let selectedTab = 'available';

    let availablePlans = [];
    let usedPlans = [];
    let allPlans = config.plans.plans || [];
    let plansInUse = [];
    const promises = allPlans.map((plan) =>
        getLastPlanState(plan.id)
            .then((planState) => {
                if (planState && planState === 'started') {
                    console.log('Plan in use', plan.id);
                    plansInUse = [...plansInUse, plan];
                } else {
                    console.log('Plan not in use', plan.id);
                }
            })
            .catch(console.error)
    );
    Promise.all(promises).then(() => {
        console.log('For loop completed');
        if (plansInUse.length > 0) {
            selectedTab = 'in-use';
        }
    });

    $: {
        availablePlans = allPlans.filter(
            (plan) => !plansInUse.some((usedPlan) => usedPlan.id === plan.id)
        );
        usedPlans = plansInUse;
        console.log('usedPlans:', usedPlans);
    }
</script>

<div class="grid grid-rows-[auto,1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar">
        <Navbar>
            <!-- <div slot="left-buttons" /> -->
            <label for="sidebar" slot="center">
                <div class="btn btn-ghost normal-case text-xl">{$t['Menu_Plans']}</div>
            </label>
            <!-- <div slot="right-buttons" class="flex items-center"> -->
        </Navbar>
    </div>

    <div class="overflow-y-auto mx-auto max-w-screen-md">
        <div
            role="tablist"
            class="dy-tabs dy-tabs-bordered"
            style={convertStyle($s['ui.plans.tabs'])}
        >
            {#if plansInUse.length > 0}
                <input
                    type="radio"
                    name="my_tabs_1"
                    role="tab"
                    class="dy-tab dy-tab-bordered {selectedTab === 'in-use' ? 'dy-tab-active' : ''}"
                    on:click={() => (selectedTab = 'in-use')}
                    aria-label={$t['Plans_Tab_My_Plans']}
                    style={convertStyle($s['ui.plans.tabs.text'])}
                />
            {/if}
            <input
                type="radio"
                name="my_tabs_1"
                role="tab"
                class="dy-tab {selectedTab === 'available' ? 'dy-tab-active' : ''}"
                on:click={() => (selectedTab = 'available')}
                aria-label={$t['Plans_Tab_Choose_Plan']}
                style={convertStyle($s['ui.plans.tabs.text'])}
            />
        </div>

        <div id="container" class="plan-chooser">
            {#if selectedTab === 'available'}
                <ul>
                    {#each availablePlans as plan}
                        <!-- add on click -->
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-no-static-element-interactions -->
                        <div
                            class="plan-chooser-plan plan-chooser-link"
                            id={plan.id}
                            on:click={() => goto(`${base}/plans/${plan.id}`)}
                        >
                            {#if plan.image}
                                <div class="plan-image-block">
                                    <img
                                        class="plan-image"
                                        src="{base}/{imageFolder}/{plan.image.file}"
                                        alt={plan.image.file}
                                        width={plan.image.width}
                                        height={plan.image.height}
                                    />
                                </div>
                            {/if}
                            <div class="plan-text-block">
                                <div class="plan-chooser-title">
                                    {plan.title[$language] ?? plan.title.default ?? ''}
                                </div>
                                <div class="plan-chooser-days">
                                    {$t['Plans_Number_Days'].replace('%d', plan.days)}
                                </div>
                            </div>
                        </div>
                    {/each}
                </ul>
            {:else if selectedTab === 'in-use'}
                <ul>
                    {#each usedPlans as plan}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-no-static-element-interactions -->
                        <div
                            class="plan-chooser-plan plan-chooser-link"
                            id={plan.id}
                            on:click={() => goto(`${base}/plans/${plan.id}`)}
                        >
                            {#if plan.image}
                                <div class="plan-image-block">
                                    <img
                                        class="plan-image"
                                        src="{base}/{imageFolder}/{plan.image.file}"
                                        alt={plan.image.file}
                                        width={plan.image.width}
                                        height={plan.image.height}
                                    />
                                </div>
                            {/if}
                            <div class="plan-text-block">
                                <div class="plan-chooser-title">
                                    {plan.title[$language] ?? plan.title.default ?? ''}
                                </div>
                                <div class="plan-chooser-days">
                                    {$t['Plans_Number_Days'].replace('%d', plan.days)}
                                </div>
                            </div>
                        </div>
                    {/each}
                </ul>
            {/if}
        </div>
    </div>
</div>
