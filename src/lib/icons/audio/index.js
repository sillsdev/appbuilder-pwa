import FastForwardIcon from './FastForwardIcon.svelte';
import MuteIcon from './MuteIcon.svelte';
import PauseIcon from './PauseIcon.svelte';
import PlayIcon from './PlayIcon.svelte';
import RewindIcon from './RewindIcon.svelte';
import SkipNextIcon from './SkipNextIcon.svelte';
import SkipPreviousIcon from './SkipPreviousIcon.svelte';
import VolumeIcon from './VolumeIcon.svelte';

const AudioIcon = {
    Mute: MuteIcon,
    Volume: VolumeIcon,
    Pause: PauseIcon,
    Play: PlayIcon,
    FF: FastForwardIcon,
    RW: RewindIcon,
    Skip: SkipNextIcon,
    Prev: SkipPreviousIcon
};

export { AudioIcon };
