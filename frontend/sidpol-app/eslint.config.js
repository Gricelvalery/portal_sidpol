// @ts-check
// ESLint (flat config) para el frontend Angular: TypeScript + plantillas HTML.
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const prettier = require('eslint-config-prettier');

/** Las reglas de accesibilidad se reportan como advertencia (no rompen el CI). */
const accesibilidadComoAdvertencia = Object.fromEntries(
  angular.configs.templateAccessibility
    .flatMap((c) => Object.keys(c.rules ?? {}))
    .map((regla) => [regla, 'warn'])
);

module.exports = tseslint.config(
  { ignores: ['dist/', '.angular/', 'node_modules/', 'coverage/'] },

  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'error',
      eqeqeq: ['error', 'always']
    }
  },

  {
    // En las pruebas se permite "any" para dobles de prueba
    files: ['**/*.spec.ts', 'src/app/testing/**/*.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'warn' }
  },

  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: accesibilidadComoAdvertencia
  },

  // Desactiva las reglas de estilo que se contradicen con Prettier (debe ir al final)
  prettier
);
