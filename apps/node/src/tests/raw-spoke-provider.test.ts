import 'dotenv/config';
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function (): string {
  return this.toString();
};

import {
  EvmRawSpokeProvider,
  Sodax,
  type Hex,
  spokeChainConfig,
  ARBITRUM_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  SonicRawSpokeProvider,
  SONIC_MAINNET_CHAIN_ID,
  SOLANA_MAINNET_CHAIN_ID,
  SolanaRawSpokeProvider,
  SpokeService,
  SUI_MAINNET_CHAIN_ID,
  SuiRawSpokeProvider,
  MoneyMarketService,
  type SpokeProviderType,
  ICON_MAINNET_CHAIN_ID,
  IconRawSpokeProvider,
  LockupPeriod,
} from '@sodax/sdk';
import { EvmWalletProvider, SolanaWalletProvider, SuiWalletProvider } from '@sodax/wallet-sdk-core';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

const evmPrivateKey = process.env.EVM_PRIVATE_KEY as Hex;
const solanaPrivateKey = process.env.SOLANA_PRIVATE_KEY;
const iconPrivateKey = process.env.ICON_PRIVATE_KEY;
const stellarPrivateKey = process.env.STELLAR_PRIVATE_KEY;
const suiWalletMnemonics = process.env.SUI_MNEMONICS;

if (!solanaPrivateKey || !evmPrivateKey || !iconPrivateKey || !stellarPrivateKey || !suiWalletMnemonics) {
  throw new Error('private keys environment variables are required');
}

const sodax = new Sodax();

const arbWalletProvider = new EvmWalletProvider({
  privateKey: evmPrivateKey as Hex,
  chainId: ARBITRUM_MAINNET_CHAIN_ID,
});

const sonicWalletProvider = new EvmWalletProvider({
  privateKey: evmPrivateKey as Hex,
  chainId: SONIC_MAINNET_CHAIN_ID,
});

const suiWalletProvider = new SuiWalletProvider({
  rpcUrl: 'https://fullnode.testnet.sui.io',
  mnemonics: suiWalletMnemonics,
});

const keypair = Keypair.fromSecretKey(new Uint8Array(bs58.decode(solanaPrivateKey)));
const solanaWallet = new SolanaWalletProvider({
  privateKey: keypair.secretKey,
  endpoint: spokeChainConfig[SOLANA_MAINNET_CHAIN_ID].rpcUrl,
});

let [arbWalletAddress, sonicWalletAddress, suiWalletAddress, solanaWalletAddress] = await Promise.all([
  arbWalletProvider.getWalletAddress(),
  sonicWalletProvider.getWalletAddress(),
  suiWalletProvider.getWalletAddress(),
  solanaWallet.getWalletAddress(),
]);
arbWalletAddress = '0xAa3Af4C13AfcdD87b5DF2BcaE21d0255b3f717F2';
suiWalletAddress = '0x04ca30474c7cef85ee6b665d242a917e044dec046f16101ed58a92533b5907aa';
sonicWalletAddress = '0xAa3Af4C13AfcdD87b5DF2BcaE21d0255b3f717F2';
const iconWalletAddress = 'hx14877826597bf7d7c69fa97b334002d377e1fa16'; // Icon address placeholder
const suiRawSpokeProvider = new SuiRawSpokeProvider(spokeChainConfig[SUI_MAINNET_CHAIN_ID], suiWalletAddress);
const arbRawSpokeProvider = new EvmRawSpokeProvider(arbWalletAddress, spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID]);
const baseRawSpokeProvider = new EvmRawSpokeProvider(arbWalletAddress, spokeChainConfig[BASE_MAINNET_CHAIN_ID]);

const sonicRawSpokeProvider = new SonicRawSpokeProvider(sonicWalletAddress, spokeChainConfig[SONIC_MAINNET_CHAIN_ID]);
const iconRawSpokeProvider = new IconRawSpokeProvider(spokeChainConfig[ICON_MAINNET_CHAIN_ID], iconWalletAddress);

const solanaRawSpokeProvider = new SolanaRawSpokeProvider({
  connection: { rpcUrl: spokeChainConfig[SOLANA_MAINNET_CHAIN_ID].rpcUrl },
  walletAddress: solanaWalletAddress,
  chainConfig: spokeChainConfig[SOLANA_MAINNET_CHAIN_ID],
});

async function createArbToSonicIntent() {
  const createArbToSonicIntentResult = await sodax.swaps.createIntent({
    intentParams: {
      inputToken: spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].nativeToken, // ETH token
      outputToken: spokeChainConfig[SONIC_MAINNET_CHAIN_ID].nativeToken, // SONIC token
      inputAmount: BigInt(1e13), // 0.00001 ETH
      minOutputAmount: 0n,
      deadline: 0n,
      allowPartialFill: false,
      srcChain: arbRawSpokeProvider.chainConfig.chain.id,
      dstChain: sonicRawSpokeProvider.chainConfig.chain.id,
      srcAddress: arbWalletAddress,
      dstAddress: sonicWalletAddress,
      solver: '0x0000000000000000000000000000000000000000',
      data: '0x',
    },
    spokeProvider: arbRawSpokeProvider,
    raw: true,
  });

  if (createArbToSonicIntentResult.ok) {
    const [rawTx, intent] = createArbToSonicIntentResult.value;
    const gasEstimate = await SpokeService.estimateGas(rawTx, arbRawSpokeProvider);

    console.log('createArbToSonicIntentResult', JSON.stringify(rawTx, null, 2));
    console.log('gasEstimate', gasEstimate);
  } else {
    console.error('Failed to create intent', createArbToSonicIntentResult.error);
  }
}

async function createSolToArbIntent() {
  const result = await sodax.swaps.createIntent({
    intentParams: {
      inputToken: spokeChainConfig[SOLANA_MAINNET_CHAIN_ID].nativeToken, // SOL token
      outputToken: spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].nativeToken, // ETH token
      inputAmount: BigInt(1e3), // 0.000001 SOL
      minOutputAmount: 0n,
      deadline: 0n,
      allowPartialFill: false,
      srcChain: solanaRawSpokeProvider.chainConfig.chain.id,
      dstChain: sonicRawSpokeProvider.chainConfig.chain.id,
      srcAddress: solanaWalletAddress,
      dstAddress: sonicWalletAddress,
      solver: '0x0000000000000000000000000000000000000000',
      data: '0x',
    },
    spokeProvider: solanaRawSpokeProvider,
    raw: true,
  });

  if (result.ok) {
    const [rawTx, intent] = result.value;
    const gasEstimate = await SpokeService.estimateGas(rawTx, solanaRawSpokeProvider);

    console.log('createArbToSonicIntentResult', JSON.stringify(rawTx, null, 2));
    console.log('gasEstimate', gasEstimate);
  } else {
    console.error('Failed to create intent', result.error);
  }
}

async function createSuiToArbIntent() {
  const result = await sodax.swaps.createIntent({
    intentParams: {
      inputToken: spokeChainConfig[SUI_MAINNET_CHAIN_ID].nativeToken, // SUI token
      outputToken: spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].nativeToken, // ETH token
      inputAmount: BigInt(1e3), // 0.000001 SUI
      minOutputAmount: 0n,
      deadline: 0n,
      allowPartialFill: false,
      srcChain: suiRawSpokeProvider.chainConfig.chain.id,
      dstChain: arbRawSpokeProvider.chainConfig.chain.id,
      srcAddress: suiWalletAddress,
      dstAddress: arbWalletAddress,
      solver: '0x0000000000000000000000000000000000000000',
      data: '0x',
    },
    spokeProvider: suiRawSpokeProvider,
    raw: true,
  });

  if (result.ok) {
    const [rawTx, intent] = result.value;
    const gasEstimate = await SpokeService.estimateGas(rawTx, suiRawSpokeProvider);

    console.log('result', JSON.stringify(rawTx, null, 2));
    console.log('gasEstimate', gasEstimate);
  } else {
    console.error('Failed to create intent', result.error);
  }
}

async function createSupplyIntent() {
  const token = spokeChainConfig[BASE_MAINNET_CHAIN_ID].nativeToken;

  const result = await sodax.moneyMarket.createSupplyIntent(
    {
      token,
      amount: BigInt(1e13), // 0.00001 ETH
      action: 'supply',
    },
    baseRawSpokeProvider,
    true,
  );

  if (result.ok) {
    const rawTx = result.value;
    console.log('rawTx', rawTx);
    const gasEstimate = await MoneyMarketService.estimateGas(rawTx, baseRawSpokeProvider);

    console.log('gasEstimate', gasEstimate);
  } else {
    console.error('Failed to create supply intent', result.error);
  }
}

async function createBorrowIntent() {
  const token = spokeChainConfig[BASE_MAINNET_CHAIN_ID].nativeToken;

  const result = await sodax.moneyMarket.createBorrowIntent(
    {
      token,
      amount: BigInt(1e13), // 0.00001 ETH
      action: 'borrow',
    },
    baseRawSpokeProvider,
    true,
  );

  if (result.ok) {
    const rawTx = result.value;
    console.log('rawTx', rawTx);
    const gasEstimate = await MoneyMarketService.estimateGas(rawTx, baseRawSpokeProvider);
    console.log('gasEstimate', gasEstimate);
  } else {
    console.error('Failed to create borrow intent', result.error);
  }
}

async function createWithdrawIntent() {
  const token = spokeChainConfig[BASE_MAINNET_CHAIN_ID].nativeToken;

  const result = await sodax.moneyMarket.createWithdrawIntent(
    {
      token,
      amount: BigInt(1e13), // 0.00001 ETH
      action: 'withdraw',
    },
    baseRawSpokeProvider,
    true,
  );

  if (result.ok) {
    const rawTx = result.value;
    console.log('rawTx', rawTx);
    const gasEstimate = await MoneyMarketService.estimateGas(rawTx, baseRawSpokeProvider);
    console.log('gasEstimate', gasEstimate);
  } else {
    console.error('Failed to create withdraw intent', result.error);
  }
}

async function createRepayIntent() {
  const token = spokeChainConfig[BASE_MAINNET_CHAIN_ID].nativeToken;

  const result = await sodax.moneyMarket.createRepayIntent(
    {
      token,
      amount: BigInt(1e13), // 0.00001 ETH
      action: 'repay',
    },
    baseRawSpokeProvider,
    true,
  );

  if (result.ok) {
    const rawTx = result.value;
    console.log('rawTx', rawTx);
    const gasEstimate = await MoneyMarketService.estimateGas(rawTx, baseRawSpokeProvider);
    console.log('gasEstimate', gasEstimate);
  } else {
    console.error('Failed to create repay intent', result.error);
  }
}

async function createBridgeIntent() {
  const srcToken = spokeChainConfig[BASE_MAINNET_CHAIN_ID].nativeToken;
  const dstToken = spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].nativeToken;

  const result = await sodax.bridge.createBridgeIntent({
    params: {
      srcChainId: BASE_MAINNET_CHAIN_ID,
      srcAsset: srcToken,
      amount: BigInt(1e13), // 0.00001 ETH
      dstChainId: ARBITRUM_MAINNET_CHAIN_ID,
      dstAsset: dstToken,
      recipient: arbWalletAddress,
    },
    spokeProvider: baseRawSpokeProvider,
    raw: true,
  });

  if (result.ok) {
    const rawTx = result.value;
    console.log('rawTx', rawTx);
    const gasEstimate = await SpokeService.estimateGas(rawTx, baseRawSpokeProvider as SpokeProviderType);
    console.log('gasEstimate', gasEstimate);
  } else {
    console.error('Failed to create bridge intent', result.error);
  }
}

async function createMigratebnUSDIntent() {
  // Test reverse migration: new bnUSD (Base) -> legacy bnUSD (Sui)
  const srcbnUSD = spokeChainConfig[BASE_MAINNET_CHAIN_ID].bnUSD; // New bnUSD on Base
  const dstbnUSD = spokeChainConfig[ICON_MAINNET_CHAIN_ID].supportedTokens.bnUSD.address;

  const result = await sodax.migration.createMigratebnUSDIntent(
    {
      srcChainId: BASE_MAINNET_CHAIN_ID,
      srcbnUSD,
      dstChainId: ICON_MAINNET_CHAIN_ID,
      dstbnUSD,
      amount: BigInt(1e13), // 0.00001 bnUSD
      to: iconWalletAddress,
    },
    baseRawSpokeProvider,
    false, // unchecked
    true, // raw
  );

  if (result.ok) {
    const [rawTx] = result.value;
    console.log('rawTx', rawTx);
    const gasEstimate = await SpokeService.estimateGas(rawTx, baseRawSpokeProvider as SpokeProviderType);
    console.log('gasEstimate', gasEstimate);
  } else {
    console.error('Failed to create migrate bnUSD intent', result.error);
  }
}

async function createRevertSodaToIcxMigrationIntent() {
  // Test revert migration: SODA (Sonic) -> ICX (Icon)
  const result = await sodax.migration.createRevertSodaToIcxMigrationIntent(
    {
      amount: BigInt(1e13), // 0.00001 SODA
      to: iconWalletAddress, // Icon address (placeholder)
    },
    sonicRawSpokeProvider,
    true, // raw
  );

  if (result.ok) {
    const rawTx = result.value;
    console.log('rawTx', rawTx);
    const gasEstimate = await SpokeService.estimateGas(rawTx, sonicRawSpokeProvider as SpokeProviderType);
    console.log('gasEstimate', gasEstimate);
  } else {
    console.error('Failed to create revert SODA to ICX migration intent', result.error);
  }
}

async function createMigrateIcxToSodaIntent() {
  // Test migration: ICX/wICX (Icon) -> SODA (Sonic)
  const ICXAddress = spokeChainConfig[ICON_MAINNET_CHAIN_ID].nativeToken;

  const result = await sodax.migration.createMigrateIcxToSodaIntent(
    {
      address: ICXAddress, // ICX token address
      amount: BigInt(1e13), // 0.00001 wICX
      to: sonicWalletAddress, // Recipient address on Sonic chain
    },
    iconRawSpokeProvider,
    true, // raw
  );

  if (result.ok) {
    const rawTx = result.value;
    console.log('rawTx', rawTx);
    const gasEstimate = await SpokeService.estimateGas(rawTx, iconRawSpokeProvider as SpokeProviderType);
    console.log('gasEstimate', gasEstimate);
  } else {
    console.error('Failed to create migrate ICX to SODA intent', result.error);
  }
}

async function createMigrateBalnIntent() {
  // Test migration: BALN (Icon) -> SODA (Sonic)
  const result = await sodax.migration.createMigrateBalnIntent(
    {
      amount: BigInt(1e13), // 0.00001 BALN
      lockupPeriod: LockupPeriod.SIX_MONTHS, // Lockup period
      to: sonicWalletAddress, // Recipient address on Sonic chain
      stake: false, // Whether to stake SODA tokens
    },
    iconRawSpokeProvider,
    true, // raw
  );

  if (result.ok) {
    const rawTx = result.value;
    console.log('rawTx', rawTx);
    const gasEstimate = await SpokeService.estimateGas(rawTx, iconRawSpokeProvider as SpokeProviderType);
    console.log('gasEstimate', gasEstimate);
  } else {
    console.error('Failed to create migrate BALN intent', result.error);
  }
}

async function main() {
  console.log('\n--- Swaps Tests ---\n');
  await createArbToSonicIntent();
  await createSolToArbIntent();
  await createSuiToArbIntent();
  console.log('\n--- Money Market Tests ---\n');
  await createSupplyIntent();
  await createWithdrawIntent();
  await createBorrowIntent();
  await createRepayIntent();
  console.log('\n--- Bridge Tests ---\n');
  await createBridgeIntent();
  console.log('\n--- Migration Tests ---\n');
  await createMigratebnUSDIntent();
  await createMigrateIcxToSodaIntent();
  await createRevertSodaToIcxMigrationIntent();
  await createMigrateBalnIntent();
}

main();
