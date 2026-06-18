module.exports = {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    theme: {
        extend: {}
    },
    safelist: [{ pattern: /grid-cols-/ }],
    //tailwind typography: https://daisyui.com/docs/layout-and-typography/
    //daisyui: https://daisyui.com/docs/use/
    plugins: [require('@tailwindcss/typography')]
};
