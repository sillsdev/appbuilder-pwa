<script lang="ts">
    // Play from https://fonts.google.com/icons
    // Filled = 1
    // Weight = 400
    // Grade = 0
    // Optical size = 24px
    let { state, color = 'black', size = '24', style = 'arrow' } = $props();

    const icons = {
        arrow: {
            play: {
                viewBox: '0 0 24 24',
                pathd: 'M8 19V5l11 7Z'
            },
            pause: {
                viewBox: '0 0 24 24',
                pathd: 'M13 19V5h6v14Zm-8 0V5h6v14Z'
            }
        },

        'outline-circle': {
            play: {
                viewBox: '0 96 960 960',
                pathd: 'm380 756 280-180-280-180v360Zm100 220q-83 0-156-31.5T197 859q-54-54-85.5-127T80 576q0-83 31.5-156T197 293q54-54 127-85.5T480 176q83 0 156 31.5T763 293q54 54 85.5 127T880 576q0 83-31.5 156T763 859q-54 54-127 85.5T480 976Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z'
            },
            pause: {
                viewBox: '0 -960 960 960',
                pathd: 'M360-320h80v-320h-80v320Zm160 0h80v-320h-80v320ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z'
            }
        },

        'filled-circle': {
            play: {
                viewBox: '0 96 960 960',
                pathd: 'm380 756 280-180-280-180v360Zm100 220q-83 0-156-31.5T197 859q-54-54-85.5-127T80 576q0-83 31.5-156T197 293q54-54 127-85.5T480 176q83 0 156 31.5T763 293q54 54 85.5 127T880 576q0 83-31.5 156T763 859q-54 54-127 85.5T480 976Z'
            }
        }
    };

    const icon_style = icons[style];
    const icon_state = $derived(state ? 'pause' : 'play');
    const current_icon = $derived(icon_style[icon_state]);
</script>

<svg
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    height={size}
    width={size}
    viewBox={current_icon.viewBox}
>
    <path d={current_icon.pathd} />
</svg>
