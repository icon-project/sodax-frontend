import 'dotenv/config';
import {
  ARBITRUM_MAINNET_CHAIN_ID,
  EvmSpokeProvider,
  type Hex,
  ICON_MAINNET_CHAIN_ID,
  IconSpokeProvider,
  Sodax,
  spokeChainConfig,
  type UnifiedBnUSDMigrateParams,
} from '@sodax/sdk';
import { IconWalletProvider } from './wallet-providers/IconWalletProvider.js';
import { EvmWalletProvider } from './wallet-providers/EvmWalletProvider.js';

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
    new EvmWalletProvider(process.env.EVM_PRIVATE_KEY as Hex, ARBITRUM_MAINNET_CHAIN_ID),
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

iconToArbTwoWayMigration();
