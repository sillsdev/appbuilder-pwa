<script lang="ts">
    import { goto } from '$app/navigation';
    import config from '$assets/config';
    import contents from '$assets/contents';
    import { audioActive, isDAB, isFirstLaunch } from '$lib/data/stores';
    import { navigateToTextReference } from '$lib/navigate';
    import { resolve } from '$lib/utils/paths';
    import { onMount } from 'svelte';
    import type { PageData } from './$types';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    onMount(async () => {
        if (isDAB(config)) {
            await goto(resolve(`/lexicon`));
            return;
        }

        const launchAction = contents?.features?.['launch-action'];
        if (data?.audio) {
            $audioActive = data.audio === '1';
        }
        if (data?.ref) {
            await navigateToTextReference(data.ref);
        } else if (launchAction === 'contents' || ($isFirstLaunch && launchAction)) {
            goto(resolve(`/contents/1`));
        } else {
            goto(resolve(`/text`));
        }
    });
</script>
