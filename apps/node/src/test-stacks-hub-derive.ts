// End-to-end regression for #1070:
// derive the hub wallet address for a real Stacks account on Sonic mainnet
// and assert it matches the value the demo + Xverse produced manually.
//
// This is the test that actually matters for users — if serializeAddressData
// drifts even by one bit, the encoded bytes passed into walletFactory's
// CREATE3 change, and the user sees a different hub wallet (= different
// balances, lost funds). Pure unit tests on the 22-byte Clarity output
// cannot catch this; we need to confirm the byte representation is the
// SAME one the hub factory contract is configured to expect.
//
// Run: pnpm exec tsx src/test-stacks-hub-derive.ts
// Network: hits Sonic mainnet RPC (read-only, no PK required).

import {
  EvmHubProvider,
  EvmWalletAbstraction,
  Sodax,
  encodeAddress,
  getHubChainConfig,
  getMoneyMarketConfig,
  type EvmHubProviderConfig,
  type SodaxConfig,
} from '@sodax/sdk';
import { SONIC_MAINNET_CHAIN_ID, STACKS_MAINNET_CHAIN_ID } from '@sodax/types';
import { solverConfig } from './config.js';

// Stacks → hub address pairs verified end-to-end against Sonic mainnet
// walletFactory.getDeployedAddress (= what the demo + Xverse show in the UI).
// Adding more rows here strengthens the regression by exercising different
// hash160 values through the same c32check → 22-byte Clarity → CREATE3 chain.
const CASES: ReadonlyArray<{ stacks: string; hub: string; note: string }> = [
  {
    stacks: 'SP1D5PA98M0PF9Z4Q4N2CDTMTD7XSZ6GE7QQG5XBX',
    hub: '0x4d4dB9f1447D44f6FdD523d03d7CCF469a572aac',
    note: 'manually verified via demo + Xverse on 2026-04-08',
  },
  {
    stacks: 'SP2NHS29N86B2E1PS8VRTWCJA8050PSM8K8734X1M',
    hub: '0xB827ff964722b1DcdA4AC28A0024797CeFAe786D',
    note: 'derived against Sonic mainnet RPC on 2026-04-09',
  },
  {
    stacks: 'SP1K8PCE9CDDKKQYH7PPKPNACY0A12NS1Z9GJE6TK',
    hub: '0x54980E4f826a77e942a5f4D891A758c23009DC8D',
    note: 'derived against Sonic mainnet RPC on 2026-04-09',
  },
];

const hubConfig = {
  hubRpcUrl: 'https://rpc.soniclabs.com',
  chainConfig: getHubChainConfig(),
} satisfies EvmHubProviderConfig;

const sodax = new Sodax({
  swaps: solverConfig,
  moneyMarket: getMoneyMarketConfig(SONIC_MAINNET_CHAIN_ID),
  hubProviderConfig: hubConfig,
} satisfies SodaxConfig);

const hubProvider = new EvmHubProvider({
  config: hubConfig,
  configService: sodax.config,
});

let failed = false;
for (const { stacks, hub: expected, note } of CASES) {
  const encoded = encodeAddress(STACKS_MAINNET_CHAIN_ID, stacks);
  const hub = await EvmWalletAbstraction.getUserHubWalletAddress(STACKS_MAINNET_CHAIN_ID, encoded, hubProvider);

  console.log(`\nstacks addr  : ${stacks}`);
  console.log(`  ${note}`);
  console.log(`  encoded    : ${encoded}`);
  console.log(`  hub        : ${hub}`);
  console.log(`  expected   : ${expected}`);

  if (hub.toLowerCase() !== expected.toLowerCase()) {
    console.error('  ❌ MISMATCH');
    failed = true;
  } else {
    console.log('  ✅ ok');
  }
}

if (failed) {
  console.error('\n❌ test-stacks-hub-derive: hub address drift detected.');
  console.error('   serializeAddressData is producing different encoded bytes than');
  console.error('   what the walletFactory contract was configured to expect.');
  console.error('   DO NOT MERGE.');
  process.exit(1);
}

console.log(`\n✅ test-stacks-hub-derive: all ${CASES.length} cases match`);
console.log('   Full chain (c32check → Clarity 22 bytes → CREATE3 hub) is consistent.');
