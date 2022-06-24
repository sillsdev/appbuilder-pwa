import { copyFileSync, cpSync } from 'fs';
import path from 'path';

export function convertMedia() {
    // Copy the css stylesheet
    copyFileSync(path.join('data', 'sab-stylesheet.css'), path.join('static'));

    // Copy the font files
    cpSync(path.join('data', 'fonts'), path.join('static'), { recursive: true });

    // Copy the images
    cpSync(path.join('data', 'images'), path.join('static'), { recursive: true });
}
