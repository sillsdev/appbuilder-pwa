<script lang="ts">
    import HistoryCard from '$lib/components/HistoryCard.svelte';
    let history = [
        { book: 'World English Bible', reference: 'Genesis 1', date: 'Today | 14:49' },
        { book: 'World English Bible', reference: 'Genesis 1:1', date: 'Today | 14:48' },
        { book: 'World English Bible', reference: 'John 1', date: 'Today | 11:09' },
        { book: 'World English Bible', reference: 'John 1:7', date: 'Today | 10:03' },
        { book: 'World English Bible', reference: 'John 1', date: 'Today | 09:48' },
        { book: 'World English Bible', reference: 'John 1:5', date: 'Today | 09:48' },
        { book: 'World English Bible', reference: 'John 1:1', date: 'Today | 09:46' },
        { book: 'World English Bible', reference: 'John 1', date: 'Today | 09:45' },
        { book: 'World English Bible', reference: 'John 1:3', date: 'Today | 09:43' },
        { book: 'World English Bible', reference: 'John 1', date: 'Today | 09:43' },
        { book: 'World English Bible', reference: 'John 1:3', date: 'Today | 09:42' },
        { book: 'World English Bible', reference: 'John 1', date: 'Yesterday | 15:36' },
        { book: 'World English Bible', reference: 'John 1:3', date: 'Yesterday | 15:30' },
        { book: 'World English Bible', reference: 'John 1', date: '22 May 2022 | 13:48' },
        { book: 'World Messianic Bible', reference: 'Yochanan 1', date: '22 May 2022 | 13:42' },
        { book: 'World English Bible', reference: 'John 1', date: '22 May 2022 | 13:39' }
    ];
</script>

<h1>History</h1>

{#each history as h}
    <HistoryCard {...h} />
{/each}
