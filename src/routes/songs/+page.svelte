<script lang="ts">
    import { base } from '$app/paths';
    import { page } from '$app/state';
    import BookSelector from '$lib/components/BookSelector.svelte';
    import Sbook from '$lib/components/SongBook.svelte';

    let { collection, id } = $props();

    // This is the path to the song's page
    let songPath = `${base}/songs/${collection}/${id}`;

    // This function can be used to navigate to the song's page
    function navigateToSong() {
        window.location.href = songPath;
    }
</script>

<div class="drawer drawer-end">
    <input id="songbook-drawer" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content">
        <!-- Page content here -->
        <label for="songbook-drawer" class="btn btn-primary">Song Books</label>
    </div>
    <div class="drawer-side">
        <label for="songbook-drawer" class="drawer-overlay"></label>
        <div class="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
            <Sbook {bookPath} />
        </div>
    </div>
</div>
