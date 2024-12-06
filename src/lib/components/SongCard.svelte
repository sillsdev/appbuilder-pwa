<script lang="ts">
    import { base } from '$app/paths';
    import { s, convertStyle } from '$lib/data/stores';

    export let id: number;
    export let title: string;

    function onSongClick() {
        console.log(`click: ${id}, ${title}`);
    }
</script>

<div
    class="history-item-block dy-card w-100 bg-base-100"
    style={convertStyle($s['ui.song.border'])}
>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div style="text-decoration:none;" on:click={onSongClick}>
        <div class="flex">
            <div class="flex-none w-14" style={convertStyle($s['ui.song.number'])}>{id}</div>
            <div class="flex-1" style={convertStyle($s['ui.song.title'])}>{title}</div>
        </div>
    </div>
</div>
