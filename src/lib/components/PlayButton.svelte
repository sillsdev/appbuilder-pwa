<script lang="ts">
    import { playPause } from '$lib/data/audio';
    import config from '$lib/data/config';
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
        color?: string;
        state: 'play' | 'pause';
    }
    let { color = 'black', state }: Props = $props();

    const size = config.mainFeatures['audio-play-button-size'] === 'normal' ? 24 : 48;
    const style = config.mainFeatures['audio-play-button-style'];
    const icon_style = icons[style];
    const Icon = $derived(icon_style[state]);
</script>

<button class="audio-control-buttons" onclick={() => playPause()}>
    <Icon {color} {size} />
</button>
