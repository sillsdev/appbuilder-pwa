import config from '$lib/data/config';
import { shareText } from '$lib/data/share';

const SHARE_FILE_NAME = 'annotations.txt';

export async function shareAnnotation(annotation: any) {
    await shareText(config.name, annotation.reference + '\n' + annotation.text, SHARE_FILE_NAME);
}

export async function shareAnnotations(annotations: any) {
    let text =
        config.name +
        '\n\n' +
        annotations.map((item) => `${item.reference}\n${item.text}`).join('\n\n');

    await shareText(config.name, text, SHARE_FILE_NAME, true);
}
