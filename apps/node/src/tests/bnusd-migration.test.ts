import 'dotenv/config';
import {
  ARBITRUM_MAINNET_CHAIN_ID,
  EvmSpokeProvider,
  type Hex,
  ICON_MAINNET_CHAIN_ID,
  IconSpokeProvider,
  SONIC_MAINNET_CHAIN_ID,
  STELLAR_MAINNET_CHAIN_ID,
  SUI_MAINNET_CHAIN_ID,
  Sodax,
  SonicSpokeProvider,
  type StellarSpokeChainConfig,
  StellarSpokeProvider,
  SolanaSpokeProvider,
  SuiSpokeProvider,
  type UnifiedBnUSDMigrateParams,
  spokeChainConfig,
} from '@sodax/sdk';
import {
  StellarWalletProvider,
  IconWalletProvider,
  EvmWalletProvider,
  SuiWalletProvider,
  type StellarWalletConfig,
  SolanaWalletProvider,
} from '@sodax/wallet-sdk-core';
import { SOLANA_MAINNET_CHAIN_ID } from '@sodax/types';
import { Keypair } from '@solana/web3.js';

// Override JSON.stringify to handle BigInt serialization as strings
// This ensures that any BigInt values in objects are stringified using .toString()
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function (): string {
  return this.toString();
};

async function iconToSolTwoWayMigration() {
  const sodax = new Sodax();

  const iconSpokeProvider = new IconSpokeProvider(
    new IconWalletProvider({
      privateKey: process.env.ICON_PRIVATE_KEY as Hex,
      rpcUrl: 'https://ctz.solidwallet.io/api/v3',
    }),
    spokeChainConfig[ICON_MAINNET_CHAIN_ID],
  );

  const solanaPrivateKey = process.env.SOLANA_PRIVATE_KEY;

  if (!solanaPrivateKey) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }

  const solPrivateKeyUint8 = new Uint8Array(Buffer.from(solanaPrivateKey, 'hex'));
  console.log('solPrivateKeyUint8', solPrivateKeyUint8);
  const keypair = Keypair.fromSecretKey(solPrivateKeyUint8);

  const solanaWallet = new SolanaWalletProvider({
    privateKey: keypair.secretKey,
    endpoint: spokeChainConfig[SOLANA_MAINNET_CHAIN_ID].rpcUrl,
  });

  const solSpokeProvider = new SolanaSpokeProvider(solanaWallet, spokeChainConfig[SOLANA_MAINNET_CHAIN_ID]);
  const iconToSolanaResult = await sodax.migration.migratebnUSD(
    {
      srcChainId: iconSpokeProvider.chainConfig.chain.id,
      dstChainId: solSpokeProvider.chainConfig.chain.id,
      srcbnUSD: iconSpokeProvider.chainConfig.bnUSD,
      dstbnUSD: solSpokeProvider.chainConfig.bnUSD,
      amount: BigInt(1e17), // test with 0.1 bnUSD
      to: await solSpokeProvider.walletProvider.getWalletAddress(),
    } satisfies UnifiedBnUSDMigrateParams,
    iconSpokeProvider,
  );

  if (iconToSolanaResult.ok) {
    const [spokeTxHash, hubTxHash] = iconToSolanaResult.value;
    console.log(`legacy bnUSD (Icon) -> new bnUSD (Solana) spokeTxHash=${spokeTxHash}, hubTxHash=${hubTxHash}`);
  } else {
    console.error('[migrateBnUSD] error', JSON.stringify(iconToSolanaResult.error, null, 2));
    throw new Error('failed to migrate bnUSD from Icon to Solana');
  }

  // wait 30 seconds
  console.log('waiting 30 seconds...');
  await new Promise(resolve => setTimeout(resolve, 30000));

  const solToIconParams = {
    srcChainId: solSpokeProvider.chainConfig.chain.id,
    dstChainId: iconSpokeProvider.chainConfig.chain.id,
    srcbnUSD: solSpokeProvider.chainConfig.bnUSD,
    dstbnUSD: iconSpokeProvider.chainConfig.bnUSD,
    amount: BigInt(1e17), // test with 0.1 bnUSD
    to: await iconSpokeProvider.walletProvider.getWalletAddress(),
  } satisfies UnifiedBnUSDMigrateParams;

  // migrate from new bnUSD from ARB to the legacy bnUSD on Icon
  const solToIconResult = await sodax.migration.migratebnUSD(solToIconParams, solSpokeProvider);

  if (solToIconResult.ok) {
    const [spokeTxHash, hubTxHash] = solToIconResult.value;
    console.log(`new bnUSD (Solana) -> legacy bnUSD (Icon) spokeTxHash=${spokeTxHash}, hubTxHash=${hubTxHash}`);
  } else {
    console.error('[migrateBnUSD] error', solToIconResult.error);
  }
}

async function iconToArbTwoWayMigration() {
  const sodax = new Sodax();

  const iconSpokeProvider = new IconSpokeProvider(
    new IconWalletProvider({
      privateKey: process.env.ICON_PRIVATE_KEY as Hex,
      rpcUrl: 'https://ctz.solidwallet.io/api/v3',
    }),
    spokeChainConfig[ICON_MAINNET_CHAIN_ID],
  );

  const evmSpokeProvider = new EvmSpokeProvider(
    new EvmWalletProvider({
      privateKey: process.env.EVM_PRIVATE_KEY as Hex,
      chainId: ARBITRUM_MAINNET_CHAIN_ID,
    }),
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID],
  );
  // // migrate from legacy bnUSD from Icon to the new bnUSD on ARB
  const iconToArbResult = await sodax.migration.migratebnUSD(
    {
      srcChainId: iconSpokeProvider.chainConfig.chain.id,
      dstChainId: evmSpokeProvider.chainConfig.chain.id,
      srcbnUSD: iconSpokeProvider.chainConfig.bnUSD,
      dstbnUSD: evmSpokeProvider.chainConfig.bnUSD,
      amount: BigInt(1e17), // test with 0.1 bnUSD
      to: await evmSpokeProvider.walletProvider.getWalletAddress(),
    } satisfies UnifiedBnUSDMigrateParams,
    iconSpokeProvider,
  );

  if (iconToArbResult.ok) {
    const [spokeTxHash, hubTxHash] = iconToArbResult.value;
    console.log(`legacy bnUSD (Icon) -> new bnUSD (ARB) spokeTxHash=${spokeTxHash}, hubTxHash=${hubTxHash}`);
  } else {
    console.error('[migrateBnUSD] error', JSON.stringify(iconToArbResult.error, null, 2));
    throw new Error('failed to migrate bnUSD from Icon to ARB');
  }

  // wait 30 seconds
  console.log('waiting 30 seconds...');
  await new Promise(resolve => setTimeout(resolve, 30000));

  const arbToIconParams = {
    srcChainId: evmSpokeProvider.chainConfig.chain.id,
    dstChainId: iconSpokeProvider.chainConfig.chain.id,
    srcbnUSD: evmSpokeProvider.chainConfig.bnUSD,
    dstbnUSD: iconSpokeProvider.chainConfig.bnUSD,
    amount: BigInt(1e17), // test with 0.1 bnUSD
    to: await iconSpokeProvider.walletProvider.getWalletAddress(),
  } satisfies UnifiedBnUSDMigrateParams;

  const isAllowed = await sodax.migration.isAllowanceValid(arbToIconParams, 'revert', evmSpokeProvider);

  if (!isAllowed.ok) {
    console.error('[reverseMigrateBnUSD] isAllowed error:', isAllowed.error);
    return;
  }

  if (isAllowed.value) {
    console.log('[reverseMigrateBnUSD] isAllowed', isAllowed.value);
  } else {
    const approveResult = await sodax.migration.approve(arbToIconParams, 'revert', evmSpokeProvider);

    if (approveResult.ok) {
      console.log('[reverseMigrateBnUSD] approveHash', approveResult.value);
      const approveTxResult = await evmSpokeProvider.walletProvider.waitForTransactionReceipt(approveResult.value);
      console.log('[reverseMigrateBnUSD] approveTxResult', approveTxResult);
    } else {
      console.error('[reverseMigrateBnUSD] approve error:', approveResult.error);
      return;
    }
  }

  // migrate from new bnUSD from ARB to the legacy bnUSD on Icon
  const arbToIconResult = await sodax.migration.migratebnUSD(arbToIconParams, evmSpokeProvider);

  if (arbToIconResult.ok) {
    const [spokeTxHash, hubTxHash] = arbToIconResult.value;
    console.log(`new bnUSD (ARB) -> legacy bnUSD (Icon) spokeTxHash=${spokeTxHash}, hubTxHash=${hubTxHash}`);
  } else {
    console.error('[migrateBnUSD] error', arbToIconResult.error);
  }
}

async function suiToSonicTwoWayMigration() {
  const sodax = new Sodax();

  const suiConfig = spokeChainConfig[SUI_MAINNET_CHAIN_ID];
  const suiWalletMnemonics = process.env.SUI_MNEMONICS;

  if (!suiWalletMnemonics) {
    throw new Error('SUI_MNEMONICS environment variable is required');
  }
  const suiWalletProvider = new SuiWalletProvider({
    rpcUrl: 'https://fullnode.mainnet.sui.io',
    mnemonics: suiWalletMnemonics,
  });
  const suiSpokeProvider = new SuiSpokeProvider(suiConfig, suiWalletProvider);

  const sonicSpokeProvider = new SonicSpokeProvider(
    new EvmWalletProvider({
      privateKey: process.env.EVM_PRIVATE_KEY as Hex,
      chainId: SONIC_MAINNET_CHAIN_ID,
    }),
    spokeChainConfig[SONIC_MAINNET_CHAIN_ID],
  );

  // // migrate from legacy bnUSD from Icon to the new bnUSD on ARB
  // const suiToSonicResult = await sodax.migration.migratebnUSD(
  //   {
  //     srcChainId: suiSpokeProvider.chainConfig.chain.id,
  //     dstChainId: sonicSpokeProvider.chainConfig.chain.id,
  //     srcbnUSD: suiSpokeProvider.chainConfig.supportedTokens.legacybnUSD.address,
  //     dstbnUSD: sonicSpokeProvider.chainConfig.bnUSD,
  //     amount: BigInt(1e4), // test with 0.001 bnUSD
  //     to: await sonicSpokeProvider.walletProvider.getWalletAddress(),
  //   } satisfies UnifiedBnUSDMigrateParams,
  //   suiSpokeProvider,
  // );

  // if (suiToSonicResult.ok) {
  //   const [spokeTxHash, hubTxHash] = suiToSonicResult.value;
  //   console.log(`legacy bnUSD (SUI) -> new bnUSD (SONIC) spokeTxHash=${spokeTxHash}, hubTxHash=${hubTxHash}`);
  // } else {
  //   console.error('[migrateBnUSD] error', JSON.stringify(suiToSonicResult.error, null, 2));
  //   throw new Error('failed to migrate bnUSD from SUI to SONIC');
  // }

  // // wait 30 seconds
  // console.log('waiting 30 seconds...');
  // await new Promise(resolve => setTimeout(resolve, 30000));

  const sonicToSuiParams = {
    srcChainId: sonicSpokeProvider.chainConfig.chain.id,
    dstChainId: suiSpokeProvider.chainConfig.chain.id,
    srcbnUSD: sonicSpokeProvider.chainConfig.bnUSD,
    dstbnUSD: suiSpokeProvider.chainConfig.supportedTokens.legacybnUSD.address,
    amount: BigInt(10000000000000), // test with 0.1 bnUSD
    to: await suiSpokeProvider.walletProvider.getWalletAddress(),
  } satisfies UnifiedBnUSDMigrateParams;

  const isAllowed = await sodax.migration.isAllowanceValid(sonicToSuiParams, 'revert', sonicSpokeProvider);

  if (!isAllowed.ok) {
    console.error('[reverseMigrateBnUSD] isAllowed error:', isAllowed.error);
    return;
  }

  if (isAllowed.value) {
    console.log('[reverseMigrateBnUSD] isAllowed', isAllowed.value);
  } else {
    const approveResult = await sodax.migration.approve(sonicToSuiParams, 'revert', sonicSpokeProvider);

    if (approveResult.ok) {
      console.log('[reverseMigrateBnUSD] approveHash', approveResult.value);
      const approveTxResult = await sonicSpokeProvider.walletProvider.waitForTransactionReceipt(approveResult.value);
      console.log('[reverseMigrateBnUSD] approveTxResult', approveTxResult);
    } else {
      console.error('[reverseMigrateBnUSD] approve error:', approveResult.error);
      return;
    }
  }

  // migrate from new bnUSD from SONIC to the legacy bnUSD on SUI
  const sonicToSuiResult = await sodax.migration.migratebnUSD(sonicToSuiParams, sonicSpokeProvider);

  if (sonicToSuiResult.ok) {
    const [spokeTxHash, hubTxHash] = sonicToSuiResult.value;
    console.log(`new bnUSD (SONIC) -> legacy bnUSD (SUI) spokeTxHash=${spokeTxHash}, hubTxHash=${hubTxHash}`);
  } else {
    console.error('[migrateBnUSD] error', sonicToSuiResult.error);
  }
}

async function stellarToSonicTwoWayMigration() {
  const sodax = new Sodax();

  const stellarConfig = spokeChainConfig[STELLAR_MAINNET_CHAIN_ID] as StellarSpokeChainConfig;
  const STELLAR_PRIVATE_KEY = process.env.STELLAR_PRIVATE_KEY ?? '';
  const STELLAR_SOROBAN_RPC_URL = stellarConfig.sorobanRpcUrl;
  const STELLAR_HORIZON_RPC_URL = stellarConfig.horizonRpcUrl;

  // Create Stellar wallet config
  const stellarWalletConfig: StellarWalletConfig = {
    type: 'PRIVATE_KEY',
    privateKey: STELLAR_PRIVATE_KEY as Hex,
    network: 'PUBLIC',
    rpcUrl: STELLAR_SOROBAN_RPC_URL,
  };

  const stellarWalletProvider = new StellarWalletProvider(stellarWalletConfig);
  const stellarSpokeProvider = new StellarSpokeProvider(stellarWalletProvider, stellarConfig, {
    horizonRpcUrl: STELLAR_HORIZON_RPC_URL,
    sorobanRpcUrl: STELLAR_SOROBAN_RPC_URL,
  });

  const sonicSpokeProvider = new SonicSpokeProvider(
    new EvmWalletProvider({
      privateKey: process.env.EVM_PRIVATE_KEY as Hex,
      chainId: SONIC_MAINNET_CHAIN_ID,
    }),
    spokeChainConfig[SONIC_MAINNET_CHAIN_ID],
  );

  const amount = BigInt(1e15); // test with 0.001 bnUSD
  // // migrate from legacy bnUSD from Icon to the new bnUSD on ARB
  const stellarToSonicResult = await sodax.migration.migratebnUSD(
    {
      srcChainId: stellarSpokeProvider.chainConfig.chain.id,
      dstChainId: sonicSpokeProvider.chainConfig.chain.id,
      srcbnUSD: stellarSpokeProvider.chainConfig.supportedTokens.legacybnUSD.address,
      dstbnUSD: sonicSpokeProvider.chainConfig.bnUSD,
      amount: amount, // test with 0.001 bnUSD
      to: await sonicSpokeProvider.walletProvider.getWalletAddress(),
    } satisfies UnifiedBnUSDMigrateParams,
    stellarSpokeProvider,
  );

  if (stellarToSonicResult.ok) {
    const [spokeTxHash, hubTxHash] = stellarToSonicResult.value;
    console.log(`legacy bnUSD (Stellar) -> new bnUSD (SONIC) spokeTxHash=${spokeTxHash}, hubTxHash=${hubTxHash}`);
  } else {
    console.error('[migrateBnUSD] error', JSON.stringify(stellarToSonicResult.error, null, 2));
    throw new Error('failed to migrate bnUSD from Stellar to SONIC');
  }

  // wait 30 seconds
  console.log('waiting 30 seconds...');
  await new Promise(resolve => setTimeout(resolve, 30000));

  const sonicToStellarParams = {
    srcChainId: sonicSpokeProvider.chainConfig.chain.id,
    dstChainId: stellarSpokeProvider.chainConfig.chain.id,
    srcbnUSD: sonicSpokeProvider.chainConfig.bnUSD,
    dstbnUSD: stellarSpokeProvider.chainConfig.supportedTokens.legacybnUSD.address,
    amount: amount, // test with 0.1 bnUSD
    to: await stellarSpokeProvider.walletProvider.getWalletAddress(),
  } satisfies UnifiedBnUSDMigrateParams;

  const isAllowed = await sodax.migration.isAllowanceValid(sonicToStellarParams, 'revert', sonicSpokeProvider);

  if (!isAllowed.ok) {
    console.error('[reverseMigrateBnUSD] isAllowed error:', isAllowed.error);
    return;
  }

  if (isAllowed.value) {
    console.log('[reverseMigrateBnUSD] isAllowed', isAllowed.value);
  } else {
    const approveResult = await sodax.migration.approve(sonicToStellarParams, 'revert', sonicSpokeProvider);

    if (approveResult.ok) {
      console.log('[reverseMigrateBnUSD] approveHash', approveResult.value);
      const approveTxResult = await sonicSpokeProvider.walletProvider.waitForTransactionReceipt(approveResult.value);
      console.log('[reverseMigrateBnUSD] approveTxResult', approveTxResult);
    } else {
      console.error('[reverseMigrateBnUSD] approve error:', approveResult.error);
      return;
    }
  }

  // migrate from new bnUSD from SONIC to the legacy bnUSD on SUI
  const sonicToStellarResult = await sodax.migration.migratebnUSD(sonicToStellarParams, sonicSpokeProvider);

  if (sonicToStellarResult.ok) {
    const [spokeTxHash, hubTxHash] = sonicToStellarResult.value;
    console.log(`new bnUSD (SONIC) -> legacy bnUSD (Stellar) spokeTxHash=${spokeTxHash}, hubTxHash=${hubTxHash}`);
  } else {
    console.error('[migrateBnUSD] error', sonicToStellarResult.error);
  }
}

// iconToSolTwoWayMigration();
// stellarToSonicTwoWayMigration();
// suiToSonicTwoWayMigration()
iconToArbTwoWayMigration();
