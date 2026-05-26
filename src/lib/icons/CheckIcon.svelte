<script lang="ts">
    // Check from https://fonts.google.com/icons
    // 'FILL' 0,
    // 'wght' 400,
    // 'GRAD' 0,
    // 'opsz' 24
    let { color = 'black', size = 24 } = $props();
</script>

<svg
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    height={size}
    width={size}
    viewBox="0 -960 960 960"
>
    <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
</svg>
