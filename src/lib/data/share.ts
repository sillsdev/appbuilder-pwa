function createShareFile(text: string, filename: string) {
    return new File([text], filename, { type: 'text/plain' });
}

export async function shareText(
    title: string,
    text: string,
    filename: string,
    preferShareFile: boolean = false
) {
    let file;
    try {
        if (navigator.share) {
            let shareData: ShareData = { title, text };
            if (preferShareFile) {
                file = createShareFile(text, filename);
                const files = [file];
                if (navigator.canShare && navigator.canShare({ files })) {
                    shareData = { ...shareData, text: '', files };
                }
            }

            await navigator.share(shareData);
            return;
        }
    } catch (error) {
        console.error('Error sharing: ', error);
    }

    // if we're here, we failed to share, so we'll try to use the download link
    const shareFile = createShareFile(title + '\n\n' + text, filename);
    const url = URL.createObjectURL(shareFile);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();

    URL.revokeObjectURL(url);
}

export async function shareImage(title: string, text: string, filename: string, image: Blob) {
    const file = new File([image], filename, { type: 'image/png' });
    try {
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            const shareData: ShareData = { title, text, files: [file] };

            await navigator.share(shareData);
            return;
        }
    } catch (error) {
        console.error('Error sharing: ', error);
    }

    // if we're here, we failed to share, so we'll try to use the download link
    const url = URL.createObjectURL(file);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();

    URL.revokeObjectURL(url);
}
