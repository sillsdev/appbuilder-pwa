<!--
@component
based on `HSplitPane` from [svelte-split-pane](https://github.com/Readiz/svelte-split-pane).  
heavily modified because it did not support more than 2 panes and touch was not working.
-->
<script>
    export /** @type {any[]} */ let panes = [];
    /** @type {HTMLDivElement[]} */ let separators = [];
    /** @type {HTMLDivElement[]} */ let paneElems = [];
    /** @type {HTMLDivElement} */ let container;

    /**% between neighboring panes*/ $: sliders = Array(panes.length - 1).fill(50);
    /**% width of pane*/ $: widths = Array(panes.length).fill(100 / panes.length);
    /**% left edge of separator*/ $: edges = Array(separators.length)
        .fill(100 / panes.length)
        .map((n, i) => n * (i + 1));
    /**
     * inital values of current separator
     * @type {any | null}
     */ let curr = null;
    const onPointerdown = (/** @type PointerEvent */ e, /** @type number*/ i) => {
        if (e.cancelable) e.preventDefault();
        curr = {
            e,
            i: i,
            offsetLeft: separators[i].offsetLeft,
            firstWidth: paneElems[i].offsetWidth,
            secondWidth: paneElems[i + 1].offsetWidth
        };
    };
    const onPointermove = (/** @type PointerEvent */ e) => {
        if (e.cancelable) e.preventDefault();
        if (curr === null) return;
        /**i is tedious to replace with curr.i*/ const i = curr.i;
        //calculate distance in px to move edge and slider
        var deltaX = Math.min(
            Math.max(e.clientX - curr.e.clientX, -curr.firstWidth),
            curr.secondWidth
        );
        //convert deltaX to %
        edges[i] = (100 * (curr.offsetLeft + deltaX)) / container.offsetWidth;
        sliders[i] =
            (100 * (curr.firstWidth + deltaX)) /
            (paneElems[i].offsetWidth + paneElems[i + 1].offsetWidth);

        //calculate new width percentages for panes on either side of separator
        const sum = widths[i] + widths[i + 1];
        widths[i] = (sum * sliders[i]) / 100;
        widths[i + 1] = (sum * (100 - sliders[i])) / 100;

        //adjust neighboring sliders if they exist
        if (i > 0) sliders[i - 1] = (100 * widths[i - 1]) / (widths[i - 1] + widths[i]);
        if (i < sliders.length)
            sliders[i + 1] = (100 * widths[i + 1]) / (widths[i + 1] + widths[i + 2]);
    };
    const onPointerup = (/** @type PointerEvent */ e) => {
        if (e && e.cancelable) e.preventDefault();
        curr = null;
    };
</script>

<div
    class="wrapper"
    bind:this={container}
    on:pointermove={onPointermove}
    on:pointerup={onPointerup}
    on:pointerleave={onPointerup}
    on:pointercancel={onPointerup}
>
    {#each panes as p, i}
        <div class="pane" style="width: {widths[i]}%" bind:this={paneElems[i]}>
            <svelte:component this={p.component} {...p.props} />
        </div>
        {#if i !== panes.length - 1}
            <div
                class="separator"
                bind:this={separators[i]}
                style="left: {edges[i]}%"
                on:pointerdown={(e) => onPointerdown(e, i)}
            />
        {/if}
    {/each}
</div>

<style>
    div.wrapper {
        display: flex;
        height: 100%;
        width: 100%;
        margin: 0 auto;
        overflow: auto;
        display: inline-flex;
    }
    div.separator {
        cursor: col-resize;
        height: 100%;
        width: 8px;
        margin-left: -2px;
        z-index: 1;
        background-color: #aaa;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='30'><path d='M2 0 v30 M5 0 v30 M8 0 v30' fill='none' stroke='black'/></svg>");
        background-repeat: no-repeat;
        background-position: center;
        touch-action: none;
    }
    div.pane {
        margin: 0 2px;
        height: 100%;
        overflow: auto;
    }
</style>
