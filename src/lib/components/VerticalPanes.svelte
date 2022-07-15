<!--
@component
based on `VSplitPane` from [svelte-split-pane](https://github.com/Readiz/svelte-split-pane).  
moderately modified because touch was not working.
-->
<script>
    /** @type {HTMLDivElement}*/ let separator;
    /** @type {HTMLDivElement}*/ let top;
    /** @type {HTMLDivElement}*/ let down;
    /** @type {HTMLDivElement} */ let container;

    let topHeight = 50;
    let downHeight = 50;
    let topEdge = 50;

    /**
     * inital values of moving separator
     * @type {any | null}
     */ let move = null;
    const onPointerdown = (/** @type {PointerEvent} */ e) => {
        if (e.cancelable) e.preventDefault();
        move = {
            e,
            offsetTop: separator.offsetHeight,
            firstHeight: top.offsetHeight,
            secondHeight: down.offsetHeight
        };
    };
    const onPointermove = (/** @type {PointerEvent} */ e) => {
        if (e.cancelable) e.preventDefault();
        if (move === null) return;
        //calculate distance in px to move separator
        var deltaY = Math.min(
            Math.max(e.clientY - move.e.clientY, -move.firstHeight),
            move.secondHeight
        );
        //adjust widths and edge
        topEdge = (100 * (move.offsetTop + deltaY)) / container.offsetHeight;
        topHeight = (100 * (move.firstHeight + deltaY)) / container.offsetHeight;
        downHeight = 100 - topHeight;
    };
    const onPointerup = (/** @type {PointerEvent} */ e) => {
        if (e && e.cancelable) e.preventDefault();
        move = null;
    };
</script>

<div
    class="wrapper"
    on:pointermove={onPointermove}
    on:pointerup={onPointerup}
    on:pointerleave={onPointerup}
    on:pointercancel={onPointerup}
    bind:this={container}
>
    <div bind:this={top} class="pane" style="height: {topHeight}%">
        <slot name="top" />
    </div>
    <div
        bind:this={separator}
        class="separator"
        on:pointerdown={onPointerdown}
        style="top: {topEdge}%"
    />
    <div bind:this={down} class="pane" style="height: {downHeight}%">
        <slot name="down" />
    </div>
</div>

<style>
    div.wrapper {
        width: 100%;
        height: 100%;
        display: flex;
        overflow: auto;
        flex-direction: column;
    }
    div.separator {
        cursor: row-resize;
        width: 100%;
        height: 8px;
        margin-top: -2px;
        z-index: 1;
        background-color: #aaa;
        touch-action: none;
    }
    div.pane {
        width: 100%;
        overflow: auto;
    }
</style>
