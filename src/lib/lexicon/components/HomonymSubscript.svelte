<script lang="ts">
    interface Props {
        word: { homonym_index?: number };
    }

    const { word }: Props = $props();
</script>

{#if word.homonym_index && word.homonym_index > 0}
    <sub>{word.homonym_index}</sub>
{/if}
