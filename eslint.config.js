const js = require('@eslint/js');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const globals = require('globals');

module.exports = [
  { ignores: ['dist/**', 'node_modules/**', 'frontend-dist/**'] },
  js.configs.recommended,
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'commonjs',
      },
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-undef': 'off', // TS ya cubre esto; evita falsos positivos con globals de Node/decoradores
      // tsconfig.json no define "lib" → TS incluye DOM por default (target ES2023),
      // lo que expone tipos globales (Body, Response, crypto) que chocan con imports
      // normales de NestJS/Node (@Body(), express.Response, node:crypto). TS ya
      // detecta redeclaraciones reales en el mismo scope; esta regla no es TS-aware.
      'no-redeclare': 'off',
    },
  },
];
