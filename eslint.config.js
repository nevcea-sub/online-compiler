import js from '@eslint/js';
import globals from 'globals';

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
                monaco: 'readonly',
                require: 'readonly',
                ace: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-console': 'off',
            semi: ['error', 'always'],
            quotes: ['error', 'single', { avoidEscape: true }],
            indent: ['error', 4, { SwitchCase: 1 }],
            'comma-dangle': ['error', 'never'],
            'no-trailing-spaces': 'error',
            'eol-last': ['error', 'always'],
            'object-curly-spacing': ['error', 'always'],
            'array-bracket-spacing': ['error', 'never'],
            'space-before-blocks': 'error',
            'keyword-spacing': 'error',
            'space-infix-ops': 'error',
            'brace-style': ['error', '1tbs', { allowSingleLine: true }],
            curly: ['error', 'all'],
            'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
            'padded-blocks': ['error', 'never'],
            'space-before-function-paren': [
                'error',
                {
                    anonymous: 'always',
                    named: 'never',
                    asyncArrow: 'always'
                }
            ]
        }
    },
    {
        files: ['scripts/**/*.cjs'],
        rules: {
            indent: 'off'
        }
    },
    {
        ignores: [
            'node_modules/**',
            'backend/node_modules/**',
            'backend/code/**',
            'backend/output/**',
            'dist/**',
            'build/**',
            '*.min.js',
            'coverage/**'
        ]
    }
];
