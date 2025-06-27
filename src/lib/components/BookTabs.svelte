<!--
@component
A component that displays the book tabs and allows the user to switch between them.
TODO:
- Everything
-->
<script>
    import config from '$lib/data/config';
    import { refs } from '$lib/data/stores';

    let curTab = 0; //Just for testing
    const bookTabs = $derived(
        config?.bookCollections
            .find((x) => x.id === $refs.collection)
            .books.find((x) => x.id === $refs.book)?.bookTabs
    );
    console.log(bookTabs.tabs);
</script>

<p>We've got BOOK TABS!</p>
<div class="dy-tabs dy-tabs-border w-full">
    {#each bookTabs.tabs as bookTab}
        <div
            class="dy-tab text-center dy-btn rounded-none border-primary border-b-5 border-x-0 border-t-0"
        >
            Tab n
        </div>
    {/each}
    <!--
    <div class="dy-tab text-center dy-btn rounded-none">Tab 2</div>
    <div class="dy-tab text-center dy-btn rounded-none">Tab 3</div>
-->
</div>
