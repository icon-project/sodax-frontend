/**
 * CommonJS reproduction for issue #939
 * https://github.com/icon-project/sodax-frontend/issues/939
 *
 * When @sodax/sdk is consumed from a CommonJS application,
 * Node.js throws ERR_PACKAGE_PATH_NOT_EXPORTED because near-api-js
 * is ESM-only and has no "require" export path.
 */
import { NEAR_MAINNET_CHAIN_ID } from '@sodax/types';
import { Sodax } from '@sodax/sdk';

console.log('Attempting to load @sodax/sdk in CommonJS...');

const sdk = new Sodax();
console.log('SDK loaded:', typeof sdk);
console.log('NEAR_MAINNET_CHAIN_ID:', NEAR_MAINNET_CHAIN_ID);
