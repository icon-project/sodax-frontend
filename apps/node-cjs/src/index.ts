import { IconWalletProvider } from '@sodax/wallet-sdk-core';
/**
 * CommonJS reproduction for issue #939
 * https://github.com/icon-project/sodax-frontend/issues/939
 *
 * When @sodax/sdk is consumed from a CommonJS application,
 * Node.js throws ERR_PACKAGE_PATH_NOT_EXPORTED because near-api-js
 * is ESM-only and has no "require" export path.
 */
import { IconSpokeProvider, Sodax, ICON_MAINNET_CHAIN_ID, NEAR_MAINNET_CHAIN_ID, spokeChainConfig } from '@sodax/sdk';

console.log('Attempting to load @sodax/sdk in CommonJS...');

const sdk = new Sodax();
console.log('SDK loaded:', typeof sdk);
console.log('NEAR_MAINNET_CHAIN_ID:', NEAR_MAINNET_CHAIN_ID);

const iconSpokeProvider = new IconSpokeProvider(new IconWalletProvider({
  // Mock private key for ICON blockchain (testing only, do not use in production)
  privateKey: '0x11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff',
  rpcUrl: 'https://ctz.solidwallet.io/api/v3',
}), spokeChainConfig[ICON_MAINNET_CHAIN_ID]);

console.log('iconSpokeProvider:', iconSpokeProvider);