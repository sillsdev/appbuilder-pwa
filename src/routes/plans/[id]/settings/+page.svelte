<script lang="ts">
    import { page } from '$app/stores';
    import Navbar from '$lib/components/Navbar.svelte';
    import { language, t } from '$lib/data/stores';
    import { addPlanState } from '$lib/data/planStates';
    import { goto } from '$app/navigation';
    import { getRoute } from '$lib/navigate';

    async function startPlan(id) {
        await addPlanState({
            id: id,
            state: 'started'
        });
        goto(getRoute(`/plans/${id}`));
    }
    function handleBackNavigation(event) {
        event.preventDefault();
        const id = $page.data.planConfig.id;
        goto(getRoute(`/plans/${id}`));
    }
</script>

<div class="grid grid-rows-[auto,1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar">
        <Navbar on:backNavigation={handleBackNavigation}>
            <!-- <div slot="left-buttons" /> -->
            <label for="sidebar" slot="center">
                <div class="btn btn-ghost normal-case text-xl">
                    {$page.data.planConfig.title[$language] ??
                        $page.data.planConfig.title.default ??
                        ''}
                </div>
            </label>
            <!-- <div slot="right-buttons" /> -->
        </Navbar>
    </div>
    <div class="overflow-y-auto mx-auto max-w-screen-md">
        <div class="plan-setup">
            <div class="plan-setup-title">
                {$t['Plans_Setup_Start_Completed_Title']}
            </div>
            <div class="plan-setup-title">
                {$t['Plans_Setup_Start_Completed_Message']}
            </div>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div
                class="plan-button"
                id="plan-continue"
                on:click={async function () {
                    await startPlan($page.data.planConfig.id);
                }}
            >
                {$t['Button_Continue']}
            </div>
        </div>
    </div>
</div>
