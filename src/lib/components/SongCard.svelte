<script lang="ts">
    import { base } from '$app/paths';
    import { s, convertStyle } from '$lib/data/stores';

    export let id: number;
    export let title: string;

    function onSongClick() {
        console.log(`click: ${id}, ${title}`);
    }
</script>

<div>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div style="text-decoration:none;" on:click={onSongClick}>
        <div class="flex space-x-4 h-16 border-b-2">
            <div
                class="flex-none w-16 flex items-center justify-end"
                style={convertStyle($s['ui.song.number'])}
            >
                {id}
            </div>
            <div
                class="flex-1 flex items-center justify-start"
                style={convertStyle($s['ui.song.title'])}
            >
                {title}
            </div>
        </div>
    </div>
</div>
