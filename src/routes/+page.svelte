<script>
    import { onMount } from 'svelte';
    import { base } from '$app/paths';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import contents from '$lib/data/contents';
    import { isFirstLaunch, audioActive } from '$lib/data/stores';
    import { navigateToTextReference } from '$lib/navigate';
    import config from '$lib/data/config';

    onMount(async () => {
        if (config.programType === 'DAB') {
            await goto(`${base}/lexicon`);
            return;
        }

        const launchAction = contents?.features?.['launch-action'];
        if ($page.data?.audio) {
            $audioActive = $page.data.audio === '1';
        }
        if ($page.data?.ref) {
            await navigateToTextReference($page.data.ref);
        } else if (launchAction === 'contents' || ($isFirstLaunch && launchAction)) {
            await goto(`${base}/contents/1`);
        } else {
            await goto(`${base}/text`);
        }
    });
</script>
