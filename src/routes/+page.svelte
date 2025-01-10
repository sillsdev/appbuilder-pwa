<script>
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import contents from '$lib/data/contents';
    import { audioActive, isFirstLaunch } from '$lib/data/stores';
    import { getRoute, navigateToTextReference } from '$lib/navigate';
    import { onMount } from 'svelte';

    onMount(() => {
        const launchAction = contents?.features?.['launch-action'];
        if ($page.data?.audio) {
            $audioActive = $page.data.audio === '1';
        }
        if ($page.data?.ref) {
            navigateToTextReference($page.data.ref);
        } else if (launchAction === 'contents' || ($isFirstLaunch && launchAction)) {
            goto(getRoute(`/contents/1`));
        } else {
            goto(getRoute(`/text`));
        }
    });
</script>
