import { CopyOptions, cpSync } from 'fs';
import path from 'path';

function cpSyncOptional(source: string, destination: string, opts?: CopyOptions): void {
    try {
        cpSync(source, destination, opts);
    } catch (e) {
        // source doesn't exist, ok.
    }
}

export function convertMedia(dataDir: string) {
    // Copy the css stylesheets
    cpSync(path.join(dataDir, 'styles'), path.join('static', 'styles'), { recursive: true });

    // Copy the font files
    cpSync(path.join(dataDir, 'fonts'), path.join('static', 'fonts'), { recursive: true });

    // Copy the images
    cpSyncOptional(path.join(dataDir, 'images'), path.join('static', 'images'), {
        recursive: true
    });

    // Copy the illustrations
    cpSyncOptional(path.join(dataDir, 'illustrations'), path.join('static', 'illustrations'), {
        recursive: true
    });
}
