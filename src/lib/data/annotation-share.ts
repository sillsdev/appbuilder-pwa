import config from '$lib/data/config';

const SHARE_FILE_NAME = 'annotations.txt';

function createShareFile(text: string) {
    return new File([text], SHARE_FILE_NAME, { type: 'text/plain' });
}

async function shareText(title: string, text: string, file: File = undefined) {
    try {
        if (navigator.share) {
            let shareData: ShareData = { title, text };
            let files = [file];
            if (file && navigator.canShare && navigator.canShare({ files })) {
                shareData = { ...shareData, text: '', files };
            }

            await navigator.share(shareData);
        } else {
            const shareFile = file ? file : createShareFile(text);
            const url = URL.createObjectURL(shareFile);

            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = SHARE_FILE_NAME;
            anchor.click();

            URL.revokeObjectURL(url);
        }
    } catch (error) {
        console.error('Error sharing: ', error);
    }
}

export async function shareAnnotation(annotation: any) {
    await shareText(config.name, annotation.reference + '\n' + annotation.text);
}

export async function shareAnnotations(annotations: any) {
    let text =
        config.name +
        '\n\n' +
        annotations.map((item) => `${item.reference}\n${item.text}`).join('\n\n');

    await shareText(config.name, text, createShareFile(text));
}
