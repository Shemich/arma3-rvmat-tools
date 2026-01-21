// eslint.config.js
import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  // Базовые настройки для всех файлов
  js.configs.recommended,

  // Настройки для TypeScript-файлов
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json', // если у вас есть tsconfig — укажите путь
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
        ...globals.browser, // если есть фронтенд-код
      },
    },
    plugins: {
      '@typescript-eslint': ts,
    },
    rules: {
      // Отключаем старое правило, чтобы не было конфликтов
      'no-unused-vars': 'off',

      // Настраиваем TypeScript-версию правила
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          // Игнорируем любые переменные/аргументы/ошибки catch, начинающиеся с _
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Ваши текущие правила из .eslintrc.json
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'warn',
      'eqeqeq': ['error', 'always'],

      // Полезные дополнения для TypeScript (можно включить по желанию)
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/consistent-type-imports': 'warn',

      // Другие часто полезные правила
      'no-var': 'warn',
      'object-shorthand': 'warn',
      'prefer-template': 'warn',
    },
  },

  // Игнорируемые папки/файлы (аналог ignorePatterns)
  {
    ignores: [
      'out/**',
      'node_modules/**',
      'dist/**',
      '*.js',           // если вы не хотите линтить скомпилированный JS
      'eslint.config.js', // можно игнорировать сам конфиг
    ],
  },
];