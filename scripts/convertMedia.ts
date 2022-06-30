import { copyFileSync, cpSync } from 'fs';
import path from 'path';

export function convertMedia(dataDir: string) {
    // Copy the css stylesheet
    copyFileSync(path.join(dataDir, 'sab-stylesheet.css'), path.join('static'));

    // Copy the font files
    cpSync(path.join(dataDir, 'fonts'), path.join('static'), { recursive: true });

    // Copy the images
    cpSync(path.join(dataDir, 'images'), path.join('static'), { recursive: true });
}
