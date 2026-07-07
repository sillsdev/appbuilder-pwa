import pkg from '../../package.json' with { type: 'json' };

export const buildInfo = {
    version: pkg.version,
    buildDate: import.meta.env.VITE_BUILD_DATE as string | undefined,
    gitHash: import.meta.env.VITE_GIT_HASH as string | undefined
};
