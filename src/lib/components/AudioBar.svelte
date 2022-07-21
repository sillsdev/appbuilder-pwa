<script>
    import { AudioIcons } from '$lib/icons';
    export let src = '';
    let audio;
</script>

<div class="w-full h-full">
    <audio bind:this={audio} {src} class="hidden w-0 h-0" />
    
</div>
