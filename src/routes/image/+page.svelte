<script lang="ts">
    import Navbar from '$lib/components/Navbar.svelte';
    import VerseOnImage from '$lib/components/VerseOnImage.svelte';
    import { t } from '$lib/data/stores';
    import { ShareIcon } from '$lib/icons';

    let verseOnImage_Component;
    console.log('t:');
    console.log($t);
    function share() {
        console.log('Share Called');
        if (verseOnImage_Component) {
            verseOnImage_Component.shareCanvas(); // Call the exported function from the VerseOnImage component
        }
    }
</script>

<div class="grid grid-rows-[auto,1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar h-16">
        <Navbar>
            <!-- <div slot="left-buttons" /> -->
            {#snippet center()}
                <label for="sidebar">
                    <div class="btn btn-ghost normal-case text-xl">{$t['Text_On_Image_Title']}</div>
                </label>
            {/snippet}
            {#snippet end()}
                <div>
                    <button class="dy-btn-sm dy-btn-ghost" on:click={share}>
                        <ShareIcon color="white" />
                    </button>
                </div>
            {/snippet}
        </Navbar>
    </div>

    <div class="overflow-y-auto" style="border:0px solid orange;">
        <VerseOnImage bind:this={verseOnImage_Component} />
    </div>
</div>
