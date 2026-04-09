// End-to-end integration test for #1070: drives the FULL swap pipeline
// (sodax.swaps.createIntent → SpokeService.deposit → StacksSpokeService.transfer)
// against Sonic mainnet RPC and asserts that the resulting reqData (the exact
// payload Xverse would sign) has correct contractAddress, contractName,
// functionName, and serialized function args byte-for-byte against the values
// captured from a real swap on the main branch.
//
// Why integration: the unit test in StacksSpokeService.test.ts only covers
// the leaf serialization step. This test covers the entire JS chain — quote
// translation, encodeAddress dispatch, EvmSolverService intent build, ABI
// encoding into the cross-chain payload, EvmAssetManagerService.depositToData,
// SpokeService dispatch, all the way down to walletProvider.sendTransaction.
//
// Network: hits Sonic mainnet RPC (read-only, for hub wallet derivation).
// Hits Hiro Stacks RPC (for getImplContractAddress).
// No PRIVATE_KEY required, no broadcast — uses raw: true to get reqData.
//
// Run: pnpm exec tsx src/test-stacks-full-swap.ts

import {
  EvmHubProvider,
  Sodax,
  StacksRawSpokeProvider,
  getHubChainConfig,
  getMoneyMarketConfig,
  loadStacksTransactions,
  spokeChainConfig,
  type EvmHubProviderConfig,
  type SodaxConfig,
} from '@sodax/sdk';

const { Cl } = await loadStacksTransactions();
import { SONIC_MAINNET_CHAIN_ID, STACKS_MAINNET_CHAIN_ID, type StacksSpokeChainConfig } from '@sodax/types';
import { solverConfig } from './config.js';

const STACKS_USER = 'SP1K8PCE9CDDKKQYH7PPKPNACY0A12NS1Z9GJE6TK';
const EXPECTED_HUB = '0x54980E4f826a77e942a5f4D891A758c23009DC8D';

const hubConfig = {
  hubRpcUrl: 'https://rpc.soniclabs.com',
  chainConfig: getHubChainConfig(),
} satisfies EvmHubProviderConfig;

const sodax = new Sodax({
  swaps: solverConfig,
  moneyMarket: getMoneyMarketConfig(SONIC_MAINNET_CHAIN_ID),
  hubProviderConfig: hubConfig,
} satisfies SodaxConfig);

const hubProvider = new EvmHubProvider({ config: hubConfig, configService: sodax.config });
const stacksConfig = spokeChainConfig[STACKS_MAINNET_CHAIN_ID] as StacksSpokeChainConfig;
const spokeProvider = new StacksRawSpokeProvider(STACKS_USER, stacksConfig);

let failed = false;
const fail = (msg: string) => {
  console.error(`❌ ${msg}`);
  failed = true;
};
const ok = (msg: string) => console.log(`✅ ${msg}`);

console.log('STX → STX self-swap (smallest possible amount)');
console.log(`  user : ${STACKS_USER}`);
console.log(`  hub  : ${EXPECTED_HUB}\n`);

const result = await sodax.swaps.createIntent({
  intentParams: {
    inputToken: stacksConfig.nativeToken,
    outputToken: stacksConfig.nativeToken,
    inputAmount: 1_000_000n, // 1 STX
    minOutputAmount: 900_000n, // 0.9 STX (loose bound — quote is opaque here)
    deadline: 0n, // 0 = no deadline → eliminates one source of byte drift
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

const [reqData] = result.value;
// biome-ignore lint/suspicious/noExplicitAny: dynamic shape
const r = reqData as any;

console.log('reqData top-level:');
console.log(`  contractAddress  : ${r.contractAddress}`);
console.log(`  contractName     : ${r.contractName}`);
console.log(`  functionName     : ${r.functionName}`);
console.log(`  postConditionMode: ${r.postConditionMode}\n`);

// ── Top-level assertions ────────────────────────────────────────────────
if (r.contractAddress === 'SP3031RGK734636C8KGW2Y76TEQBTVX59Q472EQH0') {
  ok('contractAddress = asset-manager deployer');
} else fail(`contractAddress mismatch: ${r.contractAddress}`);

if (r.contractName === 'asset-manager-impl') ok('contractName = asset-manager-impl');
else fail(`contractName mismatch: ${r.contractName}`);

if (r.functionName === 'transfer') ok('functionName = transfer');
else fail(`functionName mismatch: ${r.functionName}`);

if (r.postConditionMode === 1) ok('postConditionMode = Allow');
else fail(`postConditionMode mismatch: ${r.postConditionMode}`);

// ── functionArgs assertions ─────────────────────────────────────────────
if (!Array.isArray(r.functionArgs) || r.functionArgs.length !== 5) {
  fail(`functionArgs length: ${r.functionArgs?.length}`);
  process.exit(1);
}

const [arg0, arg1, arg2, arg3, arg4] = r.functionArgs;

// arg0: token = STX native → noneCV()
const arg0Hex = Cl.serialize(arg0);
if (arg0Hex === '09') ok('arg0 = NoneCV (STX native)');
else fail(`arg0 mismatch: ${arg0Hex}`);

// arg1: recipient buffer = hub address (20 bytes) — must equal EXPECTED_HUB
const expectedArg1 = '020000001454980e4f826a77e942a5f4d891a758c23009dc8d';
const arg1Hex = Cl.serialize(arg1);
if (arg1Hex.toLowerCase() === expectedArg1.toLowerCase()) ok(`arg1 = BufferCV(hub ${EXPECTED_HUB})`);
else fail(`arg1 mismatch:\n    got ${arg1Hex}\n    exp ${expectedArg1}`);

// arg2: amount = 1_000_000 → uintCV
const expectedArg2 = '01000000000000000000000000000f4240';
const arg2Hex = Cl.serialize(arg2);
if (arg2Hex === expectedArg2) ok('arg2 = UIntCV(1_000_000)');
else fail(`arg2 mismatch: ${arg2Hex}`);

// arg3: cross-chain payload buffer — contains random intentId + non-deterministic
// intent struct, so we can't snapshot exact bytes. Assert structural shape only:
//   - It's a BufferCV with non-trivial length
//   - It contains the user's encoded address (0x0516…) at least twice
//     (srcAddress and dstAddress of the intent)
const arg3Hex = Cl.serialize(arg3);
const userEncoded = '0516668b31c9635b39dfd13dad3b554cf014115721fa';
const occurrences = (arg3Hex.match(new RegExp(userEncoded, 'g')) ?? []).length;
if (arg3Hex.startsWith('02') && arg3Hex.length > 200) ok(`arg3 = BufferCV (length ${arg3Hex.length / 2 - 5} bytes)`);
else fail(`arg3 not a buffer or too short: ${arg3Hex.slice(0, 80)}`);
if (occurrences >= 2)
  ok(`arg3 contains user encoded address ${occurrences}x (srcAddress + dstAddress)`);
else fail(`arg3 missing user encoded address (found ${occurrences}x, expected ≥2)`);

// arg4: connection-v3 contract principal — fully deterministic, snapshot it
const expectedArg4 = '0616c030e21338c86199889c382f1cda75d7adf4a9b90d636f6e6e656374696f6e2d7633';
const arg4Hex = Cl.serialize(arg4);
if (arg4Hex === expectedArg4) ok('arg4 = ContractPrincipalCV(connection-v3)');
else fail(`arg4 mismatch:\n    got ${arg4Hex}\n    exp ${expectedArg4}`);

if (failed) {
  console.error('\n❌ test-stacks-full-swap: FAIL');
  process.exit(1);
}
console.log(
  '\n✅ test-stacks-full-swap: full pipeline (createIntent → deposit → transfer) produces correct reqData',
);
console.log('   Stacks-side bytes byte-for-byte match the values captured from main branch demo.');
