import config from '$lib/data/config';

export async function shareAnnotation(annotation: any) {
    try {
        await navigator.share({
            title: config.name,
            text: annotation.reference + '\n' + annotation.text
        });
        console.log('Successfully shared');
    } catch (error) {
        console.error('Error sharing: ', error);
    }
}

export async function shareAnnotations(annotations: any) {
    let text = config.name;
    annotations.forEach((item) => {
        text += '\n\n' + item.reference + '\n' + item.text;
    });

    const file = new File([text], 'annotations.txt', { type: 'text/plain' });

    try {
        await navigator.share({
            title: config.name,
            files: [file]
        });
        console.log('Successfully shared');
    } catch (error) {
        console.error('Error sharing: ', error);
    }
}
