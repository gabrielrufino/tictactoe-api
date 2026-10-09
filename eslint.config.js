import antfu from '@antfu/eslint-config';

export default antfu({
  typescript: true,
  ignores: ['demo/'],
  rules: {
    'no-console': 'warn',
    'style/semi': ['error', 'always'],
    'style/quotes': ['error', 'single'],
    'ts/no-empty-object-type': 'off',
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
  },
});
