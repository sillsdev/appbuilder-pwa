<script>
    import { AudioIcon } from '$lib/icons';
    import { refs } from '$lib/data/stores';
    //based on https://svelte.dev/repl/b0a901d9a15347bd95466150485e4a78?version=3.31.0
    export let src = '';
    let duration = NaN;
    let progress = 0;
    let timer;
    let playing = false;
    $: audio = (() => {
        const a = new Audio(src);
        a.onloadedmetadata = () => {
			duration = a.duration;
			updateTime();
		}
        return a;
    })();

    function updateTime() {
		progress = audio.currentTime;
		if (audio.ended) toggleTimeRunning();
	}
    const toggleTimeRunning = () => {
		if (audio.ended) {
			playing = false;
			clearInterval(timer);
		} else {
			timer = setInterval(updateTime, 100);
		}
	}

    const playPause = () => {
        playing = !playing;
        toggleTimeRunning();
        console.log(playing ? 'playing' : 'paused');
        if(playing) {
            audio.play()
        }
        else {
            audio.pause()
        }
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
    $: console.log(`${audio?.currentTime} : ${duration}`)
    $: console.log("source: '"+audio?.src+"'\nsrc: '"+src+"'")
</script>

<div class="w-11/12 h-5/6 bg-base-100 mx-auto rounded-full flex items-center flex-col">
    <div class="flex flex-col justify-center w-11/12 flex-grow">
        {#if src}
            <progress
                class="dy-progress w-11/12 h-1 place-self-end mx-2 my-1"
                value={progress}
                max={duration}
            />
        {:else}
            <progress class="dy-progress w-11/12 h-1 place-self-end mx-2 my-1" value="0" max="1" />
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
