<script>
    import { AudioIcon } from '$lib/icons';
    export let src = '';
    let audio;
</script>

<div class="w-full h-full">
    <audio bind:this={audio} {src} class="hidden w-0 h-0" />
    <div class="inline-flex">
        <AudioIcon.Prev />
        <AudioIcon.RW />
        <AudioIcon.Play />
        <AudioIcon.FF />
        <AudioIcon.Skip />
    </div>
</div>
