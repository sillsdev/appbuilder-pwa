<script lang="ts">
    export let collection: App.CollectionEntry;
    export let selected = false;
</script>

<div class="layout-item-block {selected ? 'layout-item-selected' : ''}" style:box-shadow="unset">
    <div class="layout-text-block normal-case text-left">
        <div class="layout-item-name">
            {collection.name}
        </div>
        {#if collection.description}
            <div class="layout-item-description">
                {collection.description}
            </div>
        {/if}
    </div>
</div>
