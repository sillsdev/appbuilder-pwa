import { compareVersions } from './stringUtils';

const verNumRegExp = /\d+(\.\d+){0,2}/;

(async () => {
    const tokenJSON = await fetch(
        'https://ghcr.io/token?scope=repository:sillsdev/app-builders:pull'
    ).then((r) => r.json());
    const token = tokenJSON.token;
    const tagJSON = await fetch('https://ghcr.io/v2/sillsdev/app-builders/tags/list', {
        headers: { Authorization: `Bearer ${token}` }
    }).then((r) => r.json());

    const tags = tagJSON.tags as string[];

    const latest = tags
        .filter((t) => t.match(verNumRegExp))
        .sort(compareVersions)
        .at(-1);

    console.log(`appbuilder_version=${latest}`);
})();
