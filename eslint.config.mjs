import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
    {
        ignores: ['dist/**', 'coverage/**', 'node_modules/**', '.turbo/**', '**/vitest.config.ts'],
    },
    {
        linterOptions: { noInlineConfig: true },
    },
    {
        files: ['**/*.ts', '**/*.mts', '**/*.cts'],
        ignores: ['apps/frontend/**'],
        extends: [...tseslint.configs.recommendedTypeChecked],
        languageOptions: {
            globals: {
                ...globals.node,
            },
            parserOptions: {
                projectService: {
                    allowDefaultProject: ['*.config.ts', '*.config.mts'],
                },
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            ...js.configs.recommended.rules,
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/explicit-function-return-type': 'error',
            '@typescript-eslint/strict-boolean-expressions': 'error',
            'no-console': 'warn',
            'eqeqeq': ['error', 'always'],
        },
    }
);
