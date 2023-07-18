module.exports = {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    theme: {
        screens: {
            '3xs': '325px',
            '2xs': '400px',
            'xs': '475px',
            'sm': '640px',
            'md': '768px',
            'lg': '1024px',
            'xl': '1280px',
            '2xl': '1536px',
        }
    },
    //tailwind typography: https://daisyui.com/docs/layout-and-typography/
    //daisyui: https://daisyui.com/docs/use/
    plugins: [require('@tailwindcss/typography'), require('daisyui')],
    daisyui: {
        prefix: 'dy-',
        themes: ['light']
    }
};
