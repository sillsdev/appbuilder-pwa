<script>
    import { onMount } from 'svelte';
    import { base } from '$app/paths';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import contents from '$lib/data/contents';
    import { isFirstLaunch, audioActive } from '$lib/data/stores';
    import { navigateToTextReference } from '$lib/navigate';

    onMount(() => {
        const launchAction = contents?.features?.['launch-action'];
        if ($page.data?.audio) {
            $audioActive = $page.data.audio === '1';
        }
        if ($page.data?.ref) {
            navigateToTextReference($page.data.ref);
        } else if (launchAction === 'contents' || ($isFirstLaunch && launchAction)) {
            goto(`${base}/contents/1`);
        } else {
            goto(`${base}/text`);
        }
    });
</script>
