<script lang="ts">
    import { playPause } from '$lib/data/audio';
    import config from '$lib/data/config';
    import { audioPlayer } from '$lib/data/stores';
    import { AudioIcon } from '$lib/icons';

    const icons = {
        arrow: {
            play: AudioIcon.Play,
            pause: AudioIcon.Pause
        },

        'outline-circle': {
            play: AudioIcon.PlayOutlineCircle,
            pause: AudioIcon.PauseOutlineCircle
        }
    };

    interface Props {
        color: string;
        size: number;
    }
    let { color = 'black', size = 24 }: Props = $props();

    const style = config.mainFeatures['audio-play-button-style'];
    const icon_style = icons[style];
    const icon_state = $derived($audioPlayer.playing ? 'pause' : 'play');
    const Icon = $derived(icon_style[icon_state]);
</script>

<button class="audio-control-buttons" onclick={() => playPause()}>
    <Icon {color} {size}/>
</button>
