<script lang="ts">
    import { BookmarkIcon, BookmarkOutlineIcon } from '$lib/icons';

    let { fillColor, emptyColor, onclick, filled } = $props();

    const icons_filled = {
        color: fillColor,
        Icon: BookmarkIcon
    };
    const icons_empty = {
        color: emptyColor,
        Icon: BookmarkOutlineIcon
    };

    const { color, Icon } = $derived(filled ? icons_filled : icons_empty);
</script>

<button class="dy-btn-sm dy-btn-ghost" {onclick}>
    <Icon {color} />
</button>
