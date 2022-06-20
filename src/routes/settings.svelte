<script lang="ts">
    import '$src/app';
    let settings: App.Settings = {
        'Text Display': {
            'Show verse numbers': {
                type: 'toggle',
                value: true
            },
            'Verse Layout': {
                type: 'select',
                value: 'Verses in paragraphs',
                options: ['Verses in paragraphs', 'One verse per line']
            },
            'Red letters': {
                type: 'toggle',
                value: true,
                subtitle: 'Show the words of Jesus in red'
            },
            'Show glossary words': {
                type: 'toggle',
                value: true
            }
        },
        Audio: {
            'Highlight synchronized phrases': {
                type: 'toggle',
                value: true,
                subtitle: 'Show current phrase in yellow when playing audio'
            },
            'Playback speed': {
                type: 'select',
                value: 'Normal',
                options: ['0.4x', '0.6x', '0.7x', '0.8x', 'Normal', '1.2x', '1.4x', '1.6x']
            }
        },
        Navigation: {
            'Book selection': {
                type: 'select',
                value: 'Grid of book abbreviations',
                options: ['List of book names', 'Grid of book abbreviations']
            },
            'Show verse selector': {
                type: 'toggle',
                value: true
            }
        }
    };
</script>

{#each Object.keys(settings) as setting}
    <h1>{setting}</h1>
    {#each Object.keys(settings[setting]) as feature}
        {#if settings[setting][feature].type === 'toggle'}
            <div class="dy-form-control w-full max-w-xs">
                <label class="dy-label cursor-pointer">
                    <span class="dy-label-text">{feature}</span>
                    <input
                        type="checkbox"
                        class="dy-toggle"
                        bind:checked={settings[setting][feature].value}
                    />
                </label>
                {#if settings[setting][feature].subtitle}
                    <!-- svelte-ignore a11y-label-has-associated-control -->
                    <label class="dy-label">
                        <span class="dy-label-text-alt">{settings[setting][feature].subtitle}</span>
                    </label>
                {/if}
            </div>
        {:else if settings[setting][feature].type === 'select'}
            <div class="dy-form-control w-full max-w-xs">
                <!-- svelte-ignore a11y-label-has-associated-control -->
                <label class="dy-label">
                    <span class="dy-label-text">{feature}</span>
                </label>
                <select
                    class="dy-select dy-select-bordered"
                    bind:value={settings[setting][feature].value}
                >
                    {#each settings[setting][feature].options ?? [] as opt}
                        <option value={opt}>{opt}</option>
                    {/each}
                </select>
                {#if settings[setting][feature].subtitle}
                    <!-- svelte-ignore a11y-label-has-associated-control -->
                    <label class="dy-label">
                        <span class="dy-label-text-alt">{settings[setting][feature].subtitle}</span>
                    </label>
                {/if}
            </div>
        {/if}
        <div class="dy-divider my-1" />
    {/each}
{/each}
