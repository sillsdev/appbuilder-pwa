<!--
  @component
  Daisy UI Stack View component
-->

<script>
    import { footnotes } from '$lib/data/stores';

    let stack;
    let listening = false;

    function clickOutside(event) {
        if (!stack.contains(event.target)) {
            footnotes.pop();
        }
    }

    function toggleListener(footnotes) {
        if (listening && footnotes.length === 0) {
            document.removeEventListener('click', clickOutside);
            listening = false;
        } else if (!listening && footnotes.length > 0) {
            document.addEventListener('click', clickOutside);
            listening = true;
        }
    }
    $: toggleListener($footnotes);
</script>

<!--
  ToDo: 
  - make width of scripture view
-->
<div bind:this={stack} class="absolute w-full bottom-8 dy-stack">
    {#each $footnotes as item}
        <div
            id="container"
            class="footnote rounded w-1/2 lg:max-w-screen-md h-40 drop-shadow-lg overflow-y-auto"
        >
            <div id="container" class="footnote">{@html item}</div>
        </div>
    {/each}
</div>
