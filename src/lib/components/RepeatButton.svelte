<script lang="ts">
    import { AudioIcon } from '$lib/icons';
    import type { Component } from 'svelte';

    interface Props {
        color?: string;
        size?: number;
        onclick: () => any;
        state: 'repeatPage' | 'repeatSelection' | 'continue' | 'stop';
    }

    let { color = 'black', size = 24, onclick, state = 'stop' }: Props = $props();

    const state_map: Record<string, Component<{ color: string; size: number }>> = {
        repeatPage: AudioIcon.Repeat,
        repeatSelection: AudioIcon.RepeatOne,
        continue: AudioIcon.RepeatOff,
        stop: AudioIcon.RepeatOffStop
    };

    const Icon = $derived(state_map[state]);
</script>

<button {onclick}>
    <Icon {color} {size} />
</button>
