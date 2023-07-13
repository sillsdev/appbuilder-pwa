<script lang="ts">
    import Navbar from '$lib/components/Navbar.svelte';
    import VerseOnImage from '$lib/components/VerseOnImage.svelte';
    import { t } from '$lib/data/stores';
</script>

<div class="grid grid-rows-[auto,1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar h-16">
        <Navbar>
            <!-- <div slot="left-buttons" /> -->
            <label for="sidebar" slot="center">
                <div class="btn btn-ghost normal-case text-xl">{$t['Text_On_Image_Title']}</div>
            </label>
            <!-- <div slot="right-buttons" /> -->
        </Navbar>
    </div>

    <div class="overflow-y-auto">
        <VerseOnImage />
    </div>
</div>
