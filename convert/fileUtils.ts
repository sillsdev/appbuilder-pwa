import { createHash } from 'crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { basename, extname, join, posix } from 'path';

export function getHashedName(dataDir: string, src: string) {
    const fullPath = join(dataDir, src);
    try {
        if (existsSync(fullPath)) {
            return getHashedNameFromContents(String(readFileSync(fullPath)), src);
        } else {
            console.warn(`Could not locate ${src}`);
            return '';
        }
    } catch (e) {
        console.error(`Error when reading ${fullPath}:\n${e}`);
        return '';
    }
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

    const hashedPath = joinUrlPath(destPrefix, getHashedName(dataDir, src));
    const dest = join('static', hashedPath);

    if (hashedPath && !existsSync(dest)) {
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
    const hashedPath = joinUrlPath(destPrefix, getHashedNameFromContents(contents, src));
    const dest = join('static', hashedPath);

    if (!existsSync(dest)) {
        writeFileSync(dest, contents);
        if (verbose) console.log(`converted ${src} to ${dest}`);
    } else if (verbose) {
        console.log(`skipping ${dest}`);
    }

    return hashedPath;
}

export function createOutputDir(dirPath: string) {
    if (existsSync(dirPath)) {
        rmSync(dirPath, { recursive: true });
    }
    mkdirSync(dirPath, { recursive: true });
}

export function deleteOutputDir(dirPath: string) {
    if (existsSync(dirPath)) {
        rmSync(dirPath, { recursive: true });
    }
}

export function joinUrlPath(...parts: string[]) {
    // Always use posix style paths for URLs
    return posix.join(...parts);
}
