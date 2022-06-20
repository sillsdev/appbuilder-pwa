<script lang="ts">
    import IconCard from '$lib/components/IconCard.svelte';
    let notes = [
        {
            id: '1',
            reference: 'John 1:9',
            text: 'He is the light',
            date: '23 May 2022',
            actions: ['View', 'Edit', 'Share', 'Delete'],
            src: 'icons/ic_note_black_24dp.png',
            alt: 'text bubble'
        },
        {
            id: '0',
            reference: 'John 1:1',
            text: 'Similar to Genesis 1:1',
            date: '23 May 2022',
            actions: ['View', 'Edit', 'Share', 'Delete'],
            src: 'icons/ic_note_black_24dp.png',
            alt: 'text bubble'
        }
    ];

    function handleMenuaction(event: CustomEvent, id: string) {
        console.log(event.detail.text + '-' + id);
    }
</script>

<h1>Notes</h1>

{#each notes as n}
    <IconCard on:menuaction={(e) => handleMenuaction(e, n.id)} {...n} />
{/each}
