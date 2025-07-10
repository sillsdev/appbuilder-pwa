// eslint.config.js

import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat'; // If you want to use eslint --inspect-config, rewrite as `flat.js`.
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

export default ts.config(
    js.configs.recommended,
    ...ts.configs.recommended,
    ...svelte.configs.recommended,
    ...svelte.configs.prettier,
    eslintConfigPrettier,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node
            }
        }
    },
    {
        files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
        // See more details at: https://typescript-eslint.io/packages/parser/
        languageOptions: {
            parserOptions: {
                projectService: true,
                extraFileExtensions: ['.svelte'], // Add support for additional file extensions, such as .svelte
                parser: ts.parser,
                // Specify a parser for each language, if needed:
                // parser: {
                //   ts: ts.parser,
                //   js: espree,    // Use espree for .js files (add: import espree from 'espree')
                //   typescript: ts.parser
                // },

                // We recommend importing and specifying svelte.config.js.
                // By doing so, some rules in eslint-plugin-svelte will automatically read the configuration and adjust their behavior accordingly.
                // While certain Svelte settings may be statically loaded from svelte.config.js even if you don’t specify it,
                // explicitly specifying it ensures better compatibility and functionality.
                svelteConfig
            }
        }
    },
    {
        rules: {
            // Override or add rule settings here, such as:
            // 'svelte/rule-name': 'error'
            'svelte/no-navigation-without-base': 'error', // Necessary since hash-based navigation.
            'svelte/no-dupe-style-properties': 'off', // Height is duplicated with dvh and vh for compatibility.
            'svelte/require-each-key': 'off', // Most each-blocks in this app do not have keys, and do not seem to need them.
            'svelte/no-unused-svelte-ignore': 'off', // Svelte ignores that are unused by eslint may be used by LSP.
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
            'no-tabs': 'error',
            'no-undef': 'off', // Covered by TS, and eslint false flags some globals
            'no-inner-declarations': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            'no-self-assign': 'off'
        }
    },
    {
        ignores: [
            '.DS_Store',
            'node_modules',
            'build',
            '.svelte-kit',
            'package',
            '.env',
            '.env.*',
            '!env.example',
            'data',
            'src/config.js',
            'static',
            'example_data',
            'test_data',
            'pnpm-lock.yaml',
            'package-lock.json',
            'yarn.lock'
        ]
    },

    // Ignore certain rules for typescript config
    {
        files: ['tailwind.config.cjs'],
        rules: {
            '@typescript-eslint/no-require-imports': 'off'
        }
    }
);
