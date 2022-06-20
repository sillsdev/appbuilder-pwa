<script lang="ts">
    import ColorCard from '$lib/components/ColorCard.svelte';

    let highlights: App.Highlight[] = [
        {
            id: '1',
            reference: 'John 1:7',
            text: 'The same came as a witness, that he might testify about the light, that all might believe through him.',
            date: '24 May 2022',
            actions: ['View', 'Share', 'Delete'],
            highlight_color: '1'
        },
        {
            id: '0',
            reference: 'John 1:3',
            text: 'All things were made through him. Without him, nothing was made that has been made.',
            date: '22 May 2022',
            actions: ['View', 'Share', 'Delete'],
            highlight_color: '2'
        }
    ];

    function handleMenuaction(event: CustomEvent, id: string) {
        console.log(event.detail.text + '-' + id);
    }
</script>

<h1>Highlights</h1>

{#each highlights as h}
    <ColorCard on:menuaction={(e) => handleMenuaction(e, h.id)} {...h} />
{/each}
