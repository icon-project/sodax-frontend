// import { describe, expect, it } from 'vitest';
// import { encodeAddress, reverseEncodeAddress } from './shared-utils.js';
// import type { SpokeChainKey } from '@sodax/types';
// import { CHAIN_KEYS, ChainKeys } from '@sodax/types';

// /** Sample address valid for `encodeAddress` / `reverseEncodeAddress` on that chain (one per spoke chain key). */
// const ROUND_TRIP_FIXTURES = {
//   [ChainKeys.AVALANCHE_MAINNET]: '0x0000000000000000000000000000000000000001',
//   [ChainKeys.ARBITRUM_MAINNET]: '0x0000000000000000000000000000000000000001',
//   [ChainKeys.BASE_MAINNET]: '0x0000000000000000000000000000000000000001',
//   [ChainKeys.BSC_MAINNET]: '0x0000000000000000000000000000000000000001',
//   [ChainKeys.HYPEREVM_MAINNET]: '0x0000000000000000000000000000000000000001',
//   [ChainKeys.LIGHTLINK_MAINNET]: '0x0000000000000000000000000000000000000001',
//   [ChainKeys.OPTIMISM_MAINNET]: '0x0000000000000000000000000000000000000001',
//   [ChainKeys.POLYGON_MAINNET]: '0x0000000000000000000000000000000000000001',
//   [ChainKeys.SONIC_MAINNET]: '0x0000000000000000000000000000000000000001',
//   [ChainKeys.ETHEREUM_MAINNET]: '0x0000000000000000000000000000000000000001',
//   [ChainKeys.REDBELLY_MAINNET]: '0x0000000000000000000000000000000000000001',
//   [ChainKeys.KAIA_MAINNET]: '0x0000000000000000000000000000000000000001',
//   [ChainKeys.INJECTIVE_MAINNET]: 'inj1xwadvz0av4kljraemgqqtrze549967n0cwn8pj',
//   [ChainKeys.ICON_MAINNET]: 'hx0136a591b8bf330f129fd75686199ee34f09ebbd',
//   [ChainKeys.SUI_MAINNET]: '0x467984afa2e97fc683501e7ea3f31c2d48a40df2a7f5e4034b67996496d70834',
//   [ChainKeys.SOLANA_MAINNET]: 'BsbfLJNfYGcZdCasYUYy9bnqVXLAD3SB48CFQukoVsH8',
//   [ChainKeys.STELLAR_MAINNET]: 'GBOKX5FMDSEYOWNOMKVN45Y3KCEAYXAT4WFGX2MLORSTMLXUZIICUE5O',
//   [ChainKeys.NEAR_MAINNET]: 'test.near',
//   [ChainKeys.BITCOIN_MAINNET]: 'bc1qxy2kgdygjrsqtzq264974r8y0tdgsskzmw7058',
//   [ChainKeys.STACKS_MAINNET]: 'SP1Y6NSNY16B531D99C6T32Y95AEZSVK12Y4JDP3D',
// } as const satisfies Record<SpokeChainKey, string>;

// describe('reverseEncodeAddress', () => {
//   it('has a round-trip fixture for every spoke chain key', () => {
//     const fixtureKeys = new Set(Object.keys(ROUND_TRIP_FIXTURES) as SpokeChainKey[]);
//     const chainKeysSet = new Set(CHAIN_KEYS);
//     expect(fixtureKeys).toEqual(chainKeysSet);
//   });

//   it('round-trips encodeAddress for every spoke chain key', () => {
//     for (const chainKey of CHAIN_KEYS) {
//       const address = ROUND_TRIP_FIXTURES[chainKey];
//       const encoded = encodeAddress(chainKey, address);
//       expect(reverseEncodeAddress(chainKey, encoded)).toBe(address);
//     }
//   });

//   it('round-trips ICON contract (cx) addresses on the same chain key as hx fixtures', () => {
//     const cxAddress = 'cx21df3e9e31cfc8c35239980835e9ad5bcc7c31b0';
//     const encoded = encodeAddress(ChainKeys.ICON_MAINNET, cxAddress);
//     expect(reverseEncodeAddress(ChainKeys.ICON_MAINNET, encoded)).toBe(cxAddress);
//   });

//   it('throws for invalid ICON version prefix in encoded hex', () => {
//     const invalidEncoded = `0x${'02'}${'0'.repeat(40)}` as `0x${string}`;
//     expect(() => reverseEncodeAddress(ChainKeys.ICON_MAINNET, invalidEncoded)).toThrow(
//       'Invalid ICON address version byte: 0x02',
//     );
//   });
// });
