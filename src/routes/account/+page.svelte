<script lang="ts">
    import Navbar from '$lib/components/Navbar.svelte';
    import { t } from '$lib/data/stores';
</script>

<div class="grid grid-rows-[auto,1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar">
        <Navbar>
            {#snippet center()}
                <label for="sidebar">
                    <div class="btn btn-ghost normal-case text-xl">{$t['Account_Page_Title']}</div>
                </label>
            {/snippet}
        </Navbar>
    </div>
    <div class="overflow-y-auto">
        <p></p>
    </div>
</div>
