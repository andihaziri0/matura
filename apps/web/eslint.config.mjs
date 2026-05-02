import nextEslintPlugin from '@next/eslint-plugin-next';
import base from '../../eslint.config.mjs';

const { flatConfig } = nextEslintPlugin;

export default [...base, flatConfig.coreWebVitals, {
  rules: {
    '@next/next/no-img-element': 'off',
  },
}];
