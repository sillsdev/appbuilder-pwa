<script lang="ts">
    import { SettingsCategory, t, userSettings } from '$lib/data/stores';

    interface Props {
        settings: App.UserPreferenceSetting[];
    }

    let { settings }: Props = $props();

    const categories: Record<SettingsCategory, App.UserPreferenceSetting[]> = $derived(
        Object.fromEntries(
            Object.values(SettingsCategory)
                .map((cat) => [cat, settings.filter((s) => s.category === cat)])
                .filter(([_, v]) => v.length)
        )
    );
</script>

<!--Interfacerough the different settings types -->
{#each Object.keys(categories) as category}
    <div class="settings-category">
        {$t[category]}
    </div>
    {#each categories[category as SettingsCategory] as setting, i}
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
                        bind:checked={$userSettings[setting.key] as boolean}
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
                        <option value={setting.values![i]}>{$t[entry] || entry}</option>
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
