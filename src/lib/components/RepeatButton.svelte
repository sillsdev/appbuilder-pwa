<script lang="ts">
    import { playMode, refs } from '$lib/data/stores';
    import { AudioIcon } from '$lib/icons';
    import type { Component } from 'svelte';

    interface Props {
        color: string;
        size?: number;
    }
    let { color = 'black', size = 24 }: Props = $props();

    const state_map: Record<string, Component<{ color: string; size: number }>> = {
        repeatPage: AudioIcon.Repeat,
        repeatSelection: AudioIcon.RepeatOne,
        continue: AudioIcon.RepeatOff,
        stop: AudioIcon.RepeatOffStop
    };

    const Icon = $derived(state_map[$playMode.mode]);
    const onclick = () => playMode.next($refs.hasAudio?.timingFile);
</script>

<button class="audio-control-buttons" {onclick}>
    <Icon {color} {size} />
</button>
