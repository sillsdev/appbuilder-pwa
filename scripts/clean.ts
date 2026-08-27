import { rimraf } from 'rimraf';

async function main() {
    await rimraf(
        [
            '.svelte-kit',
            'build',
            'src/gen-assets',
            'src/lib/data/catalog.js',
            'static/illustrations',
            'static/icons',
            'static/collections',
            'static/contents',
            'static/manifest*.json'
        ],
        { glob: true }
    );

    console.log('🔔 Reminder: The project cannot be built until the conversion scripts are run again.');
}

main();
