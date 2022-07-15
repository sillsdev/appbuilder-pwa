<script lang="ts">
    import IconCard from '$lib/components/IconCard.svelte';
    import { BookmarkIcon } from '$lib/icons';
    let bookmarks = [
        {
            id: '1',
            reference: 'John 1:5',
            text: "The light shines in the darkness and the darkness hasn't overcome it.",
            date: '22 May 2022',
            actions: ['View', 'Share', 'Delete']
        },
        {
            id: '0',
            reference: 'John 1:1',
            text: 'In the beginning was the Word, and the Word was with God, and the Word was God.',
            date: '21 May 2022',
            actions: ['View', 'Share', 'Delete']
        }
    ];

    function handleMenuaction(event: CustomEvent, id: string) {
        console.log(event.detail.text + '-' + id);
    }
</script>

<h1>Bookmarks</h1>

{#each bookmarks as b}
    <IconCard on:menuaction={(e) => handleMenuaction(e, b.id)} {...b}>
        <BookmarkIcon slot="icon" _class="fill-red-700"/>   
    </IconCard>
{/each}
