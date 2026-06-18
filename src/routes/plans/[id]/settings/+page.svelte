<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolve } from '$lib/utils/paths';
    import Navbar from '$lib/components/Navbar.svelte';
    import { addPlanState } from '$lib/data/planStates';
    import { language, t } from '$lib/data/stores';
    import type { PageData } from './$types';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    async function startPlan(id: string) {
        await addPlanState({
            id: id,
            state: 'started'
        });
        goto(resolve(`/plans/${id}`));
    }
    function backNavigation() {
        const id = data.planConfig?.id;
        if (id) {
            goto(resolve(`/plans/${id}`));
        }
    }
</script>

<div class="grid grid-rows-[auto,1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar">
        <Navbar {backNavigation}>
            {#snippet center()}
                <label for="sidebar">
                    <div class="btn btn-ghost normal-case text-xl">
                        {data.planConfig?.title[$language] ?? data.planConfig?.title.default ?? ''}
                    </div>
                </label>
            {/snippet}
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
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="plan-button"
                id="plan-continue"
                onclick={async function () {
                    await startPlan(data.planConfig!.id);
                }}
            >
                {$t['Button_Continue']}
            </div>
        </div>
    </div>
</div>
