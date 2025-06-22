<script>
    import { page } from '$app/stores';
    import config from '$lib/data/config';
    import contents from '$lib/data/contents';
    import { audioActive, isFirstLaunch } from '$lib/data/stores';
    import { gotoRoute, navigateToTextReference } from '$lib/navigate';
    import { onMount } from 'svelte';

    onMount(async () => {
        if (config.programType === 'DAB') {
            await gotoRoute(`/lexicon`);
            return;
        }

        const launchAction = contents?.features?.['launch-action'];
        if ($page.data?.audio) {
            $audioActive = $page.data.audio === '1';
        }
        if ($page.data?.ref) {
            await navigateToTextReference($page.data.ref);
        } else if (launchAction === 'contents' || ($isFirstLaunch && launchAction)) {
            gotoRoute(`/contents/1`);
        } else {
            gotoRoute(`/text`);
        }
    });
</script>
