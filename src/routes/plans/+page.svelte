<script>
    import { base } from '$app/paths';
    import BottomNavigationBar from '$lib/components/BottomNavigationBar.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import config from '$lib/data/config';
    import { getLastPlanState } from '$lib/data/planStates';
    import {
        convertStyle,
        language,
        modal,
        MODAL_COLLECTION,
        MODAL_TEXT_APPEARANCE,
        s,
        t,
        themeColors
    } from '$lib/data/stores';
    import { gotoRoute } from '$lib/navigate';
    import { compareVersions } from '$lib/scripts/stringUtils';

    const imageFolder =
        compareVersions(config.programVersion, '12.0') < 0 ? 'illustrations' : 'plans';

    const { selectedTab, availablePlans, completedPlans, usedPlans, allPlans, plansInUse } = state({
        selectedTab: 'available',
        availablePlans: [],
        completedPlans: [],
        usedPlans: [],
        allPlans: config.plans.plans || [],
        plansInUse: []
    });

    effect(async () => {
        const promises = $allPlans.map((plan) =>
            getLastPlanState(plan.id)
                .then((planState) => {
                    if (planState === 'started') {
                        plansInUse.set([...$plansInUse, plan]);
                    }
                    if (planState === 'completed') {
                        completedPlans.set([...$completedPlans, plan]);
                    }
                })
                .catch(console.error)
        );

        await Promise.all(promises);
        if ($plansInUse.length > 0) {
            selectedTab.set('in-use');
        }

        availablePlans.set(
            $allPlans.filter((plan) => !$plansInUse.some((usedPlan) => usedPlan.id === plan.id))
        );
        usedPlans.set($plansInUse);
    });

    const bottomNavBarEnabled = config?.bottomNavBarItems && config?.bottomNavBarItems.length > 0;
    const barType = 'plans';
</script>
