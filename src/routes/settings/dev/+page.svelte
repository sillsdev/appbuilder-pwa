<script lang="ts">
    import { buildInfo } from '$lib/build-info';
    import Navbar from '$lib/components/Navbar.svelte';
    import Settings from '$lib/components/Settings.svelte';
    import { direction, t } from '$lib/data/stores';
    import { devPreferenceSettings } from '$lib/data/stores/setting';

    const showBuildInfo = buildInfo.version || buildInfo.gitHash || buildInfo.buildDate;
</script>

<div
    class="grid grid-rows-[auto_1fr]"
    style="height:100vh;height:100dvh; font-family: initial;"
    dir={$direction}
>
    <div class="navbar">
        <Navbar>
            {#snippet center()}
                <label for="sidebar">
                    <div class="btn btn-ghost normal-case text-xl">{$t['Menu_Settings']}</div>
                </label>
            {/snippet}
        </Navbar>
    </div>
    <div class="overflow-y-auto">
        <Settings settings={devPreferenceSettings}></Settings>
        {#if showBuildInfo}
            <div class="settings-category">Build Info</div>
            {#if buildInfo.version}
                <div class="dy-form-control settings-item w-full max-w-lg">
                    <div class="dy-label py-0">
                        <div class="settings-title">Version</div>
                        <span>{buildInfo.version}</span>
                    </div>
                </div>
            {/if}
            {#if buildInfo.gitHash}
                <div class="dy-form-control settings-item w-full max-w-lg">
                    <div class="dy-label py-0">
                        <div class="settings-title">Git Hash</div>
                        <span>{buildInfo.gitHash}</span>
                    </div>
                </div>
            {/if}
            {#if buildInfo.buildDate}
                <div class="dy-form-control settings-item w-full max-w-lg">
                    <div class="dy-label py-0">
                        <div class="settings-title">Build Date</div>
                        <span>{buildInfo.buildDate}</span>
                    </div>
                </div>
            {/if}
        {/if}
    </div>
</div>
