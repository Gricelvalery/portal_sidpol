// ESLint (flat config) para el backend Node.js (CommonJS).
const js = require('@eslint/js');
const globals = require('globals');
const prettier = require('eslint-config-prettier');

module.exports = [
  { ignores: ['node_modules/', 'coverage/'] },

  js.configs.recommended,

  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { ...globals.node }
    },
    rules: {
      // Parámetros o variables que empiezan con "_" se ignoran a propósito
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
      eqeqeq: ['error', 'always'],
      'no-console': 'warn', // pasa a 'error' cuando todo use el logger (pino)
      'prefer-const': 'error',
      'no-var': 'error'
    }
  },

  {
    files: ['tests/**/*.js'],
    languageOptions: { globals: { ...globals.jest } },
    rules: { 'no-console': 'off' } // las pruebas espían console
  },

  // Desactiva las reglas de estilo que se contradicen con Prettier (debe ir al final)
  prettier
];
