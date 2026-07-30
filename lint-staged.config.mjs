import { relative } from 'path'
 
// https://nextjs.org/docs/app/api-reference/config/eslint#running-lint-on-staged-files
const buildEslintCommand = (filenames) =>
  `eslint --fix ${filenames
    .map((f) => `"${relative(process.cwd(), f)}"`)
    .join(' ')}`
 
const config = {
  '*.{js,jsx,ts,tsx}': [buildEslintCommand],
  'app/**/{page,layout}.{js,jsx,ts,tsx}': () => 'pnpm lint:routes:fix',
};

export default config;
