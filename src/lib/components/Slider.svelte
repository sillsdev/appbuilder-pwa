<!--
@component
A simple slider component.
-->

<script>
    import { direction } from '$lib/data/stores';
    export let barColor;
    export let progressColor;
    export let value;
    export let min;
    export let max;
    $: linePercent = ((value - min) * 100) / (max - min) + '% 100%';
</script>

<input
    type="range"
    bind:value
    {min}
    {max}
    style:background-size={linePercent}
    style:--progressColor={progressColor}
    style:--barColor={barColor}
    style:--scale={$direction.toLowerCase() === 'ltr' ? 1 : -1}
/>

<style>
    /*See https://nikitahl.com/style-range-input-css */

    :root {
        --progressColor: grey;
        --barColor: grey;
    }

    input[type='range'] {
        -webkit-appearance: none;
        appearance: none;
        margin-right: 15px;
        width: auto;
        height: 7px;
        background: var(--barColor);
        border-radius: 5px;
        background-image: linear-gradient(
            var(--progressColor),
            var(--progressColor)
        ); /* Implemented as a gradient to distinguish from background. */
        background-repeat: no-repeat;
        transform: scaleX(var(--scale));
    }

    /* Input Thumb */
    input[type='range']::-webkit-slider-thumb {
        -webkit-appearance: none;
        height: 20px;
        width: 20px;
        border-radius: 50%;
        background: var(--progressColor);
        cursor: ew-resize;
        box-shadow: 0 0 2px 0 #555;
        transition: background 0.3s ease-in-out;
        transform: scaleX(var(--scale));
    }

    input[type='range']::-moz-range-thumb {
        -webkit-appearance: none;
        appearance: none;
        height: 20px;
        width: 20px;
        border-radius: 50%;
        background: var(--progressColor);
        cursor: ew-resize;
        box-shadow: 0 0 2px 0 #555;
        transition: background 0.3s ease-in-out;
        transform: scaleX(var(--scale));
    }

    input[type='range']::-ms-thumb {
        -webkit-appearance: none;
        appearance: none;
        height: 20px;
        width: 20px;
        border-radius: 50%;
        background: var(--progressColor);
        cursor: ew-resize;
        box-shadow: 0 0 2px 0 #555;
        transition: background 0.3s ease-in-out;
        transform: scaleX(var(--scale));
    }

    input[type='range']::-webkit-slider-thumb:hover {
        background: var(--progressColor);
    }

    input[type='range']::-moz-range-thumb:hover {
        background: var(--progressColor);
    }

    input[type='range']::-ms-thumb:hover {
        background: var(--progressColor);
    }

    /* Input Track */
    input[type='range']::-webkit-slider-runnable-track {
        -webkit-appearance: none;
        box-shadow: none;
        border: none;
        background: transparent;
        transform: scaleX(var(--scale));
    }

    input[type='range']::-moz-range-track {
        -webkit-appearance: none;
        appearance: none;
        box-shadow: none;
        border: none;
        background: transparent;
        transform: scaleX(var(--scale));
    }

    input[type='range']::-ms-track {
        -webkit-appearance: none;
        appearance: none;
        box-shadow: none;
        border: none;
        background: transparent;
        transform: scaleX(var(--scale));
    }
</style>
