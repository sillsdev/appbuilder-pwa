<script lang="ts">
    import { direction, t, userSettings } from '$lib/data/stores';
    import * as s from '$lib/data/stores/setting';

    interface Props {
        settings: Array<App.UserPreferenceSetting>;
    }

    let { settings }: Props = $props();

    let categories = [];
    [
        s.SETTINGS_CATEGORY_TEXT_DISPLAY,
        s.SETTINGS_CATEGORY_AUDIO,
        s.SETTINGS_CATEGORY_NOTIFICATIONS,
        s.SETTINGS_CATEGORY_NAVIGATION,
        s.SETTINGS_CATEGORY_INTERFACE
    ].forEach((element) => {
        const fs = settings.filter((s) => s.category === element);
        if (fs.length > 0) {
            categories[element] = fs;
        }
    });
</script>

<!-- loops through the different settings types -->
{#each Object.keys(categories) as category}
    <div class="settings-category">
        {$t[category]}
    </div>
    {#each categories[category] as setting, i}
        {#if setting.type === 'checkbox'}
            <div
                class="dy-form-control settings-item w-full max-w-lg"
                class:settings-separator={i > 0}
            >
                <label class="dy-label py-0 cursor-pointer">
                    <div class="settings-title">
                        {$t[setting.title] || setting.title}
                    </div>
                    <input
                        type="checkbox"
                        class="dy-checkbox"
                        bind:checked={$userSettings[setting.key]}
                    />
                </label>
                {#if setting.summary}
                    <div class="settings-summary py-0 ps-1">
                        {$t[setting.summary]}
                    </div>
                {/if}
            </div>
            <!-- multiple choice setting -->
        {:else if setting.type === 'list'}
            <div
                class="dy-form-control settings-item w-full max-w-lg"
                class:settings-separator={i > 0}
            >
                <div class="settings-title py-0">
                    {$t[setting.title] || setting.title}
                </div>
                <select
                    class="dy-select dy-select-ghost dy-select-sm px-0"
                    bind:value={$userSettings[setting.key]}
                >
                    {#each setting.entries ?? [] as entry, i}
                        <option value={setting.values[i]}>{$t[entry] || entry}</option>
                    {/each}
                </select>
                {#if setting.summary}
                    <div class="settings-summary py-0">
                        {$t[setting.summary]}
                    </div>
                {/if}
            </div>
        {:else if setting.type === 'time'}
            <div
                class="dy-form-control settings-item w-full max-w-lg"
                class:settings-separator={i > 0}
            >
                <div class="settings-title py-0">
                    {$t[setting.title]}
                </div>
                <!-- TODO: Time Control -->
                <div class="settings-summary py-0">{setting.defaultValue}</div>
                {#if setting.summary}
                    <div class="settings-summary py-0">{$t[setting.summary]}</div>
                {/if}
            </div>
        {/if}
    {/each}
{/each}
