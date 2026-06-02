<script lang="ts">
    import { resolve } from '$app/paths';
    import { convertStyle, s, t, themeColors } from '$lib/data/stores';
    import type { SongBook } from '$lib/types';

    export let Sbook: SongBook;

    // This is the path to the book's page
    export let bookPath = resolve(`/songs/${Sbook.collection}/${Sbook.id}`);
    //export let bookPath = resolve(`/songs/${Sbook.collection}/${Sbook.id}`);

    // This function can be used to navigate to the book's page
    function navigateToBook() {
        window.location.href = bookPath;
    }
</script>
