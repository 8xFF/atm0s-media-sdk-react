// @ts-check
/* eslint-env node */

/**
 * An object with Prettier.js options.
 * @type {import('prettier').Options}
 */
const options = {
  bracketSameLine: true,
  quoteProps: 'consistent',
  singleQuote: true,
  trailingComma: 'all',
  tabWidth: 2,
  printWidth: 120,
};

module.exports = options;
