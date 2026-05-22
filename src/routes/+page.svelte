<script lang="ts">
    import config from '$assets/config';
    import contents from '$assets/contents';
    import { audioActive, isDAB, isFirstLaunch } from '$lib/data/stores';
    import { gotoRoute, navigateToTextReference } from '$lib/navigate';
    import { onMount } from 'svelte';
    import type { PageData } from './$types';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    onMount(async () => {
        if (isDAB(config)) {
            await gotoRoute(`/lexicon`);
            return;
        }

        const launchAction = contents?.features?.['launch-action'];
        if (data?.audio) {
            $audioActive = data.audio === '1';
        }
        if (data?.ref) {
            await navigateToTextReference(data.ref);
        } else if (launchAction === 'contents' || ($isFirstLaunch && launchAction)) {
            gotoRoute(`/contents/1`);
        } else {
            gotoRoute(`/text`);
        }
    });
</script>
