// Verifies that getSimulateDepositParams (the only internal SDK path that
// passes Stacks contract principals through encodeAddress) works end-to-end
// against Sonic mainnet RPC. Confirms the contract-principal handling in
// serializeAddressData isn't dead code drift — it produces the same encoded
// bytes that the old @stacks/transactions Cl.principal path would have.
//
// Run: pnpm exec tsx src/test-stacks-sim-params.ts
// Network: Sonic + Hiro mainnet RPC, read-only, no PK required.

import {
  EvmHubProvider,
  Sodax,
  StacksRawSpokeProvider,
  StacksSpokeService,
  encodeAddress,
  getHubChainConfig,
  getMoneyMarketConfig,
  loadStacksTransactions,
  spokeChainConfig,
  type EvmHubProviderConfig,
  type SodaxConfig,
} from '@sodax/sdk';
import { SONIC_MAINNET_CHAIN_ID, STACKS_MAINNET_CHAIN_ID, type StacksSpokeChainConfig } from '@sodax/types';
import { solverConfig } from './config.js';

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
const userAddress = 'SP1K8PCE9CDDKKQYH7PPKPNACY0A12NS1Z9GJE6TK';
const rawProvider = new StacksRawSpokeProvider(userAddress, stacksConfig);

// Test 4 token shapes flowing through getSimulateDepositParams.token
const tokens = [
  stacksConfig.nativeToken, // 'ST000…nativetoken'
  stacksConfig.bnUSD, // 'SP3031…bnusd'
  stacksConfig.supportedTokens.SODA.address,
  stacksConfig.supportedTokens.sBTC.address,
];

const m = await loadStacksTransactions();
let failed = false;

for (const token of tokens) {
  const params = await StacksSpokeService.getSimulateDepositParams(
    { from: userAddress as `0x${string}`, token, amount: 1000n, data: '0x' },
    rawProvider,
    hubProvider,
  );

  // Reference: encode the same token via @stacks/transactions Cl.principal
  // (the path PR #1074 used). Our serializeAddressData must match.
  const refTokenBytes = `0x${m.serializeCV(m.Cl.principal(token))}`;
  const refSrcBytes = `0x${m.serializeCV(m.Cl.principal(stacksConfig.addresses.assetManager))}`;

  // From SpokeService line 51, params.from = userAddress (standard principal),
  // already encoded via encodeAddress in the deposit() entry — re-derive:
  const ourFromBytes = encodeAddress(STACKS_MAINNET_CHAIN_ID, userAddress);
  const refFromBytes = `0x${m.serializeCV(m.Cl.principal(userAddress))}`;

  const tokenOk = params.token === refTokenBytes;
  const srcOk = params.srcAddress === refSrcBytes;
  const fromOk = params.from === refFromBytes && params.from === ourFromBytes;

  console.log(`\n[${token}]`);
  console.log(`  token  ${tokenOk ? '✅' : '❌'}  ours=${params.token}`);
  if (!tokenOk) console.log(`              ref =${refTokenBytes}`);
  console.log(`  src    ${srcOk ? '✅' : '❌'}  ours=${params.srcAddress}`);
  if (!srcOk) console.log(`              ref =${refSrcBytes}`);
  console.log(`  from   ${fromOk ? '✅' : '❌'}  ours=${params.from}`);
  if (!fromOk) console.log(`              ref =${refFromBytes}`);
  console.log(`  to     ${params.to}  (hub address derived via CREATE3)`);

  if (!tokenOk || !srcOk || !fromOk) failed = true;
}

if (failed) {
  console.error('\n❌ test-stacks-sim-params: FAIL — contract principal byte drift');
  process.exit(1);
}
console.log(`\n✅ test-stacks-sim-params: all ${tokens.length} tokens match @stacks/transactions byte-for-byte`);
console.log('   Contract-principal handling in serializeAddressData is correct in real SDK call path.');
