<!--
@component
A component to display menu options in a grid.
-->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { s, refs, themeBookColors, convertStyle } from '$lib/data/stores.js';
    import config from '$lib/data/config';
    export let options = [];
    export let cols = 6;

    const dispatch = createEventDispatcher();
    $: rows = Math.ceil(options.length / cols);

    $: bookCollectionColor = (id: string) => {
        const section = config.bookCollections
            .find((x) => x.id === $refs.docSet.split('_')[1])
            .books.find((x) => x.id === id)?.section;
        let color = Object.keys($themeBookColors).includes(section)
            ? $themeBookColors[section]
            : $s['ui.button.book-grid']['background-color'];
        return color;
    };

    function handleClick(opt: string) {
        dispatch('menuaction', {
            text: opt
        });
    }
</script>

<!--
  ri - row index
  ci - column index
  see https://svelte.dev/tutorial/each-blocks
-->

  <table style:border-spacing="5px">
      {#each Array(rows) as _, ri}
          <tr>
              {#each Array(cols) as _, ci}
                  {#if ri * cols + ci < options.length}
                      <td style:border="none" style:border-radius="0px">
                          <!-- svelte-ignore a11y-click-events-have-key-events -->
                          <span
                              on:click={() => handleClick(options[ri * cols + ci])}
                              class="dy-btn dy-btn-square dy-btn-ghost p-0"
                              style={convertStyle(
                                  Object.fromEntries(
                                      Object.entries($s['ui.button.book-grid']).filter(
                                          ([key]) => key != 'background-color'
                                      )
                                  )
                              )}
                              style:background-color={bookCollectionColor(options[ri * cols + ci])}
                          >
                              {options[ri * cols + ci]}
                          </span></td
                      >
                  {/if}
              {/each}
          </tr>
      {/each}
  </table>

<style>
    table {
        width: 100%;
        margin-left: auto;
        margin-right: auto;
        padding: 0px;
        border-collapse: unset;
    }
    tr {
        width: 100%;
        margin: 0px;
        padding: 0px;
    }
    td {
        text-align: center;
        overflow: hidden;
        margin: 0px;
        padding: 0px;
        position: relative;
        border: 1px solid;
        border-radius: 0px;
    }
    span {
        text-overflow: ''; /* Works on Firefox only */
        overflow: hidden;
        display: inline-block;
        border-radius: 0px;
        padding: 1.2em 0;
        vertical-align: middle;
    }
</style>
