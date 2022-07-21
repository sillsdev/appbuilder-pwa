<script>
    import { AudioIcon } from '$lib/icons';
    export let src = '';
    /**@type{HTMLMediaElement}*/ let audio;
</script>

<div class="w-11/12 h-5/6 bg-base-100 mx-auto rounded-full flex items-center flex-col">
    <audio bind:this={audio} {src} class="w-0 h-0" />
    <div class="flex flex-col justify-center w-11/12 flex-grow">
        {#if audio?.readyState}
            <progress
                class="dy-progress w-full h-1 place-self-end m-2"
                value={audio.currentTime}
                max={audio.duration}
            />
        {:else}
            <progress class="dy-progress w-full h-1 place-self-end mx-2 my-1" value="0" max="1" />
        {/if}
        <div class="dy-btn-group place-self-center">
            <button class="dy-btn-sm dy-btn-ghost">
                <AudioIcon.Prev />
            </button>
            <button class="dy-btn-sm dy-btn-ghost">
                <AudioIcon.RW />
            </button>
            <button class="dy-btn-sm dy-btn-ghost">
                {#if audio?.paused}
                    <AudioIcon.Play />
                {:else}
                    <AudioIcon.Pause />
                {/if}
            </button>
            <button class="dy-btn-sm dy-btn-ghost">
                <AudioIcon.FF />
            </button>
            <button class="dy-btn-sm dy-btn-ghost">
                <AudioIcon.Skip />
            </button>
        </div>
    </div>
</div>
