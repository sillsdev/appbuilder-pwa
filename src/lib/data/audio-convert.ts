import { FFmpeg } from '@ffmpeg/ffmpeg';
import type { FileData } from '@ffmpeg/ffmpeg/dist/esm/types';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

//
//-y -i /data/user/0/com.example.app.scripture/cache/B01___01_Matthew_____ENGWEBN2DA.mp3
//-map_metadata 0 -ss 00:00:20.120 -to 00:00:28.960
//-map 0:a -acodec copy -write_xing 0
// "/storage/emulated/0/Android/data/com.example.app.scripture/files/WEB Gospels/Matthew_1_3.mp3"

let ffmpeg: FFmpeg = null;
let loaded = false;
export async function loadFFmpeg() {
    if (!ffmpeg) {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.1/dist/umd';
        ffmpeg = new FFmpeg();
        ffmpeg.on('log', ({ message }) => {
            console.log(message);
        });
        // toBlobURL is used to bypass CORS issue, urls with the same
        // domain can be used directly.
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
        });
        loaded = true;
    }
}

export async function convert(
    inputPath: string,
    timingStart: string,
    timingEnd: string,
    output: string
): Promise<FileData> {
    if (!loaded) {
        await loadFFmpeg();
    }

    const input = 'input.' + inputPath.split('.').pop();
    await ffmpeg.writeFile(input, await fetchFile(inputPath));
    await ffmpeg.exec([
        '-i',
        input,
        '-map_metadata',
        '0',
        '-ss',
        timingStart,
        '-to',
        timingEnd,
        '-map',
        '0:a',
        '-acodec',
        'copy',
        '-write_xing',
        '0',
        output
    ]);
    const data = await ffmpeg.readFile(output);
    await ffmpeg.deleteFile(input);
    await ffmpeg.deleteFile(output);
    return data;
}
