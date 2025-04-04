<script>
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import config from '$lib/data/config';
    import contents from '$lib/data/contents';
    import { audioActive, isFirstLaunch } from '$lib/data/stores';
    import { getRoute, navigateToTextReference } from '$lib/navigate';
    import { onMount } from 'svelte';

    onMount(async () => {
        if (config.programType === 'DAB') {
            await goto(getRoute(`/lexicon`));
            return;
        }

        const launchAction = contents?.features?.['launch-action'];
        if ($page.data?.audio) {
            $audioActive = $page.data.audio === '1';
        }
        if ($page.data?.ref) {
            await navigateToTextReference($page.data.ref);
        } else if (launchAction === 'contents' || ($isFirstLaunch && launchAction)) {
            goto(getRoute(`/contents/1`));
        } else {
            goto(getRoute(`/text`));
        }
    });
</script>
