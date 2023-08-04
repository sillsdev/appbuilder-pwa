import config from '$lib/data/config';
import { shareText } from '$lib/data/share';

const SHARE_FILE_NAME = 'annotations.txt';

function title() {
    let text = '';
    if (config.mainFeatures['annotation-share-subject']) {
        text += config.mainFeatures['annotation-share-subject'] + '\n';
    } else {
        text += config.name + '\n';
    }
    if (config.mainFeatures['annotation-share-email']) {
        text += config.mainFeatures['annotation-share-email'] + '\n';
    }
    return text;
}

export async function shareAnnotation(annotation: any) {
    let text = annotation.reference + '\n' + annotation.text;
    await shareText(title(), text, SHARE_FILE_NAME);
}

export async function shareAnnotations(annotations: any) {
    let text =
        config.name +
        '\n\n' +
        annotations.map((item) => `${item.reference}\n${item.text}`).join('\n\n');

    await shareText(title(), text, SHARE_FILE_NAME, true);
}
