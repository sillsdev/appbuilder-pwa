<script lang="ts">
    import config from '$assets/config';
    import { language, SettingsCategory, t, userSettings } from '$lib/data/stores';

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
    const fontRelativeSize = $derived(
        config.interfaceLanguages?.writingSystems[$language]?.fontRelativeSize
    );
    const fontSize = $derived(fontRelativeSize ? fontRelativeSize : '100');
</script>

<!-- loops through the different settings types -->
{#each Object.keys(categories) as category}
    <div class="settings-category" style:font-size="{fontSize}%">
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
                        <div style:font-size="{fontSize}%">
                            {$t[setting.title] || setting.title}
                        </div>
                    </div>
                    <input
                        type="checkbox"
                        class="dy-checkbox dy-checkbox-neutral"
                        bind:checked={$userSettings[setting.key] as boolean}
                    />
                </label>
                {#if setting.summary}
                    <div class="settings-summary py-0 ps-1">
                        <div style:font-size="{fontSize}%">
                            {$t[setting.summary]}
                        </div>
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
                    <div style:font-size="{fontSize}%">
                        {$t[setting.title] || setting.title}
                    </div>
                </div>
                <select
                    class="dy-select dy-select-ghost dy-select-sm appearance-none px-0 w-full"
                    style:font-size="{fontSize}%"
                    bind:value={$userSettings[setting.key]}
                >
                    {#each setting.entries ?? [] as entry, i}
                        <option value={setting.values![i]}>{$t[entry] || entry}</option>
                    {/each}
                </select>
                {#if setting.summary}
                    <div class="settings-summary py-0">
                        <div style:font-size="{fontSize}%">
                            {$t[setting.summary]}
                        </div>
                    </div>
                {/if}
            </div>
        {:else if setting.type === 'time'}
            <div
                class="dy-form-control settings-item w-full max-w-lg"
                class:settings-separator={i > 0}
            >
                <div class="settings-title py-0">
                    <div style:font-size="{fontSize}%">
                        {$t[setting.title]}
                    </div>
                </div>
                <!-- TODO: Time Control -->
                <div class="settings-summary py-0">
                    <div style:font-size="{fontSize}%">{setting.defaultValue}</div>
                </div>
                {#if setting.summary}
                    <div class="settings-summary py-0">
                        <div style:font-size="{fontSize}%">{$t[setting.summary]}</div>
                    </div>
                {/if}
            </div>
        {/if}
    {/each}
{/each}
