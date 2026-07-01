<script lang="ts">
    import { BookmarkIcon, BookmarkOutlineIcon } from '$lib/icons';

    let { fillColor, emptyColor, onclick, filled } = $props();

    const icons_filled = $derived({
        color: fillColor,
        Icon: BookmarkIcon
    });
    const icons_empty = $derived({
        color: emptyColor,
        Icon: BookmarkOutlineIcon
    });

    const { color, Icon } = $derived(filled ? icons_filled : icons_empty);
</script>

<button class="dy-btn dy-btn-sm dy-btn-ghost" {onclick}>
    <Icon {color} />
</button>
