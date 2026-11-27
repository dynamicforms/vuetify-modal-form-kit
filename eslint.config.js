import velis from 'eslint-config-velis';

export default [
  ...velis,
  {
    files: ['docs/components/**/*.{js,ts,vue}'],
    languageOptions: { parserOptions: { project: './docs/tsconfig.json' } },
  },
  {
    files: ['docs/.vitepress/**/*.ts'],
    languageOptions: { parserOptions: { project: './docs/.vitepress/tsconfig.json' } },
  },
  {
    ignores: [
      'dist/*',
      'coverage/*',
      'node_modules/*',
      'docs/.vitepress/cache/*',
      'docs/.vitepress/dist/*',
      'docs/node_modules/*',
      'vite.config.ts'
    ]
  }
];
