// Regression tests for #1070: verifies @stacks/transactions bundled into SDK
// works correctly for both sync encoding and full swap pipeline.
//
// Run: pnpm exec tsx src/test-stacks.ts

import {
  EvmHubProvider,
  Sodax,
  StacksRawSpokeProvider,
  encodeAddress,
  getHubChainConfig,
  getMoneyMarketConfig,
  serializeAddressData,
  spokeChainConfig,
  type EvmHubProviderConfig,
  type SodaxConfig,
} from '@sodax/sdk';
import { SONIC_MAINNET_CHAIN_ID, STACKS_MAINNET_CHAIN_ID, type StacksSpokeChainConfig } from '@sodax/types';
import { solverConfig } from './config.js';

let failed = false;
const fail = (msg: string) => {
  console.error(`❌ ${msg}`);
  failed = true;
};
const ok = (msg: string) => console.log(`✅ ${msg}`);

// ── 1. Sync encode tests ──────────────────────────────────────────────
console.log('=== Sync encode tests ===\n');

{
  const addr = 'SP1D5PA98M0PF9Z4Q4N2CDTMTD7XSZ6GE7QQG5XBX';
  const expected = '0x05165a5b2928a02cf4fc972544c6ea9a69fb9f9a0e3d';
  const enc = encodeAddress(STACKS_MAINNET_CHAIN_ID, addr);
  const ser = serializeAddressData(addr);
  if (enc === expected && ser === expected) ok(`standard principal: ${enc}`);
  else fail(`standard principal mismatch: enc=${enc} ser=${ser}`);
}

{
  const addr = 'SP3031RGK734636C8KGW2Y76TEQBTVX59Q472EQH0.asset-manager-impl';
  const expected = '0x0616c030e21338c86199889c382f1cda75d7adf4a9b91261737365742d6d616e616765722d696d706c';
  const enc = encodeAddress(STACKS_MAINNET_CHAIN_ID, addr);
  if (enc === expected) ok(`contract principal: ${enc.slice(0, 40)}...`);
  else fail(`contract principal mismatch: ${enc}`);
}

{
  const addr = 'SP000000000000000000002Q6VF78';
  const expected = '0x05160000000000000000000000000000000000000000';
  const enc = encodeAddress(STACKS_MAINNET_CHAIN_ID, addr);
  if (enc === expected) ok(`zero address: ${enc}`);
  else fail(`zero address mismatch: ${enc}`);
}

// ── 2. Full swap pipeline ─────────────────────────────────────────────
console.log('\n=== Full swap pipeline ===\n');

const STACKS_USER = 'SP1K8PCE9CDDKKQYH7PPKPNACY0A12NS1Z9GJE6TK';
const hubConfig = {
  hubRpcUrl: 'https://rpc.soniclabs.com',
  chainConfig: getHubChainConfig(),
} satisfies EvmHubProviderConfig;

const sodax = new Sodax({
  swaps: solverConfig,
  moneyMarket: getMoneyMarketConfig(SONIC_MAINNET_CHAIN_ID),
  hubProviderConfig: hubConfig,
} satisfies SodaxConfig);

const stacksConfig = spokeChainConfig[STACKS_MAINNET_CHAIN_ID] as StacksSpokeChainConfig;
const spokeProvider = new StacksRawSpokeProvider(STACKS_USER, stacksConfig);

const result = await sodax.swaps.createIntent({
  intentParams: {
    inputToken: stacksConfig.nativeToken,
    outputToken: stacksConfig.nativeToken,
    inputAmount: 1_000_000n,
    minOutputAmount: 900_000n,
    deadline: 0n,
    allowPartialFill: false,
    srcChain: STACKS_MAINNET_CHAIN_ID,
    dstChain: STACKS_MAINNET_CHAIN_ID,
    srcAddress: STACKS_USER,
    dstAddress: STACKS_USER,
    solver: '0x0000000000000000000000000000000000000000',
    data: '0x',
  },
  spokeProvider,
  raw: true,
});

if (!result.ok) {
  console.error('createIntent failed:', result.error);
  process.exit(1);
}

// biome-ignore lint/suspicious/noExplicitAny: dynamic shape
const r = (result.value as any)[0];

if (r.contractAddress === 'SP3031RGK734636C8KGW2Y76TEQBTVX59Q472EQH0') ok('contractAddress');
else fail(`contractAddress: ${r.contractAddress}`);

if (r.contractName === 'asset-manager-impl') ok('contractName');
else fail(`contractName: ${r.contractName}`);

if (r.functionName === 'transfer') ok('functionName');
else fail(`functionName: ${r.functionName}`);

if (r.postConditionMode === 1) ok('postConditionMode');
else fail(`postConditionMode: ${r.postConditionMode}`);

if (Array.isArray(r.functionArgs) && r.functionArgs.length === 5) ok('functionArgs (5 args)');
else fail(`functionArgs length: ${r.functionArgs?.length}`);

// ── Result ────────────────────────────────────────────────────────────
if (failed) {
  console.error('\n❌ test-stacks: FAILED');
  process.exit(1);
}
console.log('\n✅ test-stacks: all checks passed');
