<script>
    import { AudioIcon } from '$lib/icons';
    import { refs } from '$lib/data/stores';
    export let src = '';
    /**@type{HTMLMediaElement}*/ let audio;

    let playing = true;

    const playPause = () => {
        playing = !playing;
        console.log(playing ? 'playing' : 'paused');
    };

    const seek = (scale) => {
        console.log(`seeking: ${scale}`);
    };

    const skip = (direction) => {
        console.log(
            `${direction}: ${JSON.stringify(
                direction < 0 ? $refs['default'].prev : $refs['default'].next
            )}`
        );
    };
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
            <button class="dy-btn-sm dy-btn-ghost" on:click={() => skip(-1)}>
                <AudioIcon.Prev />
            </button>
            <button class="dy-btn-sm dy-btn-ghost" on:click={() => seek(-1)}>
                <AudioIcon.RW />
            </button>
            <button class="dy-btn-sm dy-btn-ghost" on:click={playPause}>
                <!--{#if audio?.paused}-->
                {#if !playing}
                    <AudioIcon.Play />
                {:else}
                    <AudioIcon.Pause />
                {/if}
            </button>
            <button class="dy-btn-sm dy-btn-ghost" on:click={() => seek(1)}>
                <AudioIcon.FF />
            </button>
            <button class="dy-btn-sm dy-btn-ghost" on:click={() => skip(1)}>
                <AudioIcon.Skip />
            </button>
        </div>
    </div>
</div>
