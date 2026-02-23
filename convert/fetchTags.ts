import { compareVersions } from './stringUtils';

const verNumRegExp = /^\d+(\.\d+){0,2}$/;

async function getDigest(token: string, ref: string) {
    return (
        await fetch(`https://ghcr.io/v2/sillsdev/app-builders/manifests/${ref}`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then((r) => r.json())
    ).config.digest as string;
}

(async () => {
    const token = (
        await fetch('https://ghcr.io/token?scope=repository:sillsdev/app-builders:pull').then((r) =>
            r.json()
        )
    ).token as string;

    const tags = (
        await fetch('https://ghcr.io/v2/sillsdev/app-builders/tags/list', {
            headers: { Authorization: `Bearer ${token}` }
        }).then((r) => r.json())
    ).tags as string[];

    const sortedTags = tags.filter((t) => t.match(verNumRegExp)).sort(compareVersions);

    const latestDigest = await getDigest(token, 'latest');

    let i = sortedTags.length;
    let digest = '';
    do {
        i--;
        digest = await getDigest(token, sortedTags[i]);
    } while (i > 0 && latestDigest !== digest);

    console.log(`appbuilder_version=${sortedTags[i]}`);
})();
