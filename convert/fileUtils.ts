import { createHash } from 'crypto';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { basename, extname, join } from 'path';

export function getHashedName(dataDir: string, src: string) {
    const fullPath = join(dataDir, src);
    return getHashedNameFromContents(String(readFileSync(fullPath)), src);
}

export function getHashedNameFromContents(contents: string, src: string) {
    const hash = createHash('md5');
    hash.update(contents);
    const digest = hash.digest('base64url');

    const ext = extname(src);
    const fname = basename(src, ext);

    return src.replace(`${fname}${ext}`, `${fname}.${digest}${ext}`);
}

export function createHashedFile(dataDir: string, src: string, verbose: number, destPrefix = '') {
    const fullPath = join(dataDir, src);

    const hashedPath = join(destPrefix, getHashedName(dataDir, src));
    const dest = join('static', hashedPath);

    if (!existsSync(dest)) {
        copyFileSync(fullPath, dest);
        if (verbose) console.log(`converted ${src} to ${dest}`);
    } else if (verbose) {
        console.log(`skipping ${dest}`);
    }

    return hashedPath;
}

export function createHashedFileFromContents(
    contents: string,
    src: string,
    verbose: number,
    destPrefix = ''
) {
    const hashedPath = join(destPrefix, getHashedNameFromContents(contents, src));
    const dest = join('static', hashedPath);

    if (!existsSync(dest)) {
        writeFileSync(dest, contents);
        if (verbose) console.log(`converted ${src} to ${dest}`);
    } else if (verbose) {
        console.log(`skipping ${dest}`);
    }

    return hashedPath;
}
