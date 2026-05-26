<script lang="ts">
    // Arrow Left from https://fonts.google.com/icons
    // Filled = 1
    // Weight = 400
    // Grade = 0
    // Optical size = 24px
    let { scale = 1.0, color = 'black' } = $props();
</script>

<svg
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    height={24 * scale}
    viewBox="0 -960 960 960"
    width={24 * scale}
>
    <path d="M560-280 360-480l200-200v400Z" />
</svg>
