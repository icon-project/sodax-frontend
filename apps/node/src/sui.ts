import type { Address, Hash, Hex } from 'viem';
import {
  EvmAssetManagerService,
  EvmHubProvider,
  EvmWalletAbstraction,
  getHubChainConfig,
  spokeChainConfig,
  SpokeService,
  type SuiSpokeChainConfig,
  SuiSpokeProvider,
  getMoneyMarketConfig,
  type EvmHubProviderConfig,
  Sodax,
  type SodaxConfig,
  type UnifiedBnUSDMigrateParams,
  type PartnerFee,
  DEFAULT_RELAYER_API_ENDPOINT,
  BridgeService,
  type CreateBridgeIntentParams,
  encodeAddress,
} from '@sodax/sdk';
import { SONIC_MAINNET_CHAIN_ID, SUI_MAINNET_CHAIN_ID, type SpokeChainId } from '@sodax/types';

import dotenv from 'dotenv';
import { solverConfig } from './config.js';
import { SuiWalletProvider } from '@sodax/wallet-sdk-core';

dotenv.config();
// load PK from .env
const IS_TESTNET = process.env.IS_TESTNET === 'true';
const HUB_RPC_URL = IS_TESTNET ? 'https://rpc.blaze.soniclabs.com' : 'https://rpc.soniclabs.com';
const HUB_CHAIN_ID = SONIC_MAINNET_CHAIN_ID;
const SUI_CHAIN_ID = SUI_MAINNET_CHAIN_ID;
const SUI_RPC_URL = IS_TESTNET ? 'https://fullnode.testnet.sui.io' : 'https://fullnode.mainnet.sui.io';

const hubChainConfig = getHubChainConfig();
const hubConfig = {
  hubRpcUrl: HUB_RPC_URL,
  chainConfig: getHubChainConfig(),
} satisfies EvmHubProviderConfig;

const moneyMarketConfig = getMoneyMarketConfig(HUB_CHAIN_ID);

const sodax = new Sodax({
  swaps: solverConfig,
  moneyMarket: moneyMarketConfig,
  hubProviderConfig: hubConfig,
} satisfies SodaxConfig);

const hubProvider = new EvmHubProvider({
  config: hubConfig,
  configService: sodax.config,
});

const relayerApiEndpoint = DEFAULT_RELAYER_API_ENDPOINT;
const bridgeService = new BridgeService({
  hubProvider,
  relayerApiEndpoint,
  config: undefined,
  configService: sodax.config,
});

const suiConfig = spokeChainConfig[SUI_CHAIN_ID] as SuiSpokeChainConfig;
const suiWalletMnemonics = process.env.SUI_MNEMONICS;

if (!suiWalletMnemonics) {
  throw new Error('SUI_MNEMONICS environment variable is required');
}
const suiWalletProvider = new SuiWalletProvider({
  rpcUrl: SUI_RPC_URL,
  mnemonics: suiWalletMnemonics,
});
const suiSpokeProvider = new SuiSpokeProvider(suiConfig, suiWalletProvider);
const walletAddress = await suiWalletProvider.getWalletAddress();
console.log('[walletAddress]:', walletAddress);
async function getBalance(token: string) {
  const balance = await suiSpokeProvider.getBalance(walletAddress, token);
  console.log('[Balance]:', balance);
}

async function depositTo(token: string, amount: bigint, recipient: Address): Promise<void> {
  const walletAddressBytes = encodeAddress(SUI_MAINNET_CHAIN_ID, await suiSpokeProvider.getWalletAddress());
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    suiSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );
  const data = EvmAssetManagerService.depositToData(
    {
      token,
      to: recipient,
      amount,
    },
    suiSpokeProvider.chainConfig.chain.id,
    sodax.config,
  );

  const txHash = await SpokeService.deposit(
    {
      from: walletAddressBytes,
      to: hubWallet,
      token,
      amount,
      data,
    },
    suiSpokeProvider,
    hubProvider,
  );

  console.log('[depositTo] txHash', txHash);
}

async function withdrawAsset(
  token: string,
  amount: bigint,
  recipient: string, // sui address
): Promise<void> {
  const walletAddressBytes = encodeAddress(SUI_MAINNET_CHAIN_ID, await suiSpokeProvider.getWalletAddress());
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    suiSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );
  const data = EvmAssetManagerService.withdrawAssetData(
    {
      token,
      to: SuiSpokeProvider.getAddressBCSBytes(recipient),
      amount,
    },
    hubProvider,
    suiSpokeProvider.chainConfig.chain.id,
  );
  const txHash = await SpokeService.callWallet(hubWallet, data, suiSpokeProvider, hubProvider);

  console.log('[withdrawAsset] txHash', txHash);
}

async function supply(token: string, amount: bigint): Promise<void> {
  const walletAddressBytes = encodeAddress(SUI_MAINNET_CHAIN_ID, await suiSpokeProvider.getWalletAddress());
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    suiSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );

  const data = sodax.moneyMarket.buildSupplyData(suiSpokeProvider.chainConfig.chain.id, token, amount, hubWallet);

  const txHash = await SpokeService.deposit(
    {
      from: walletAddressBytes,
      token,
      amount,
      data,
    },
    suiSpokeProvider,
    hubProvider,
  );

  console.log('[supply] txHash', txHash);
}

async function borrow(token: string, amount: bigint): Promise<void> {
  const walletAddressBytes = encodeAddress(SUI_MAINNET_CHAIN_ID, await suiSpokeProvider.getWalletAddress());
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    suiSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );
  console.log(hubWallet);
  const data: Hex = sodax.moneyMarket.buildBorrowData(
    hubWallet,
    walletAddressBytes,
    token,
    amount,
    suiSpokeProvider.chainConfig.chain.id,
  );

  const txHash = await SpokeService.callWallet(hubWallet, data, suiSpokeProvider, hubProvider);

  console.log('[borrow] txHash', txHash);
}

async function withdraw(token: string, amount: bigint): Promise<void> {
  const walletAddressBytes = encodeAddress(SUI_MAINNET_CHAIN_ID, await suiSpokeProvider.getWalletAddress());
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    suiSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );

  const data: Hex = sodax.moneyMarket.buildWithdrawData(
    hubWallet,
    walletAddressBytes,
    token,
    amount,
    suiSpokeProvider.chainConfig.chain.id,
  );

  const txHash = await SpokeService.callWallet(hubWallet, data, suiSpokeProvider, hubProvider);

  console.log('[withdraw] txHash', txHash);
}

async function repay(token: string, amount: bigint): Promise<void> {
  const walletAddressBytes = encodeAddress(SUI_MAINNET_CHAIN_ID, await suiSpokeProvider.getWalletAddress());
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    suiSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );
  const data: Hex = sodax.moneyMarket.buildRepayData(suiSpokeProvider.chainConfig.chain.id, token, amount, hubWallet);

  const txHash = await SpokeService.deposit(
    {
      from: walletAddressBytes,
      token,
      amount,
      data,
    },
    suiSpokeProvider,
    hubProvider,
  );

  console.log('[repay] txHash', txHash);
}

/**
 * Migrates legacy bnUSD tokens to new bnUSD tokens.
/**
 * Migrates legacy bnUSD tokens to new bnUSD tokens.
 * This function handles the migration of legacy bnUSD tokens to new bnUSD tokens.
 *
 * @param newbnUSD - The address of the new bnUSD token to receive
 * @param amount - The amount of legacy bnUSD tokens to migrate
 * @param recipient - The address that will receive the migrated new bnUSD tokens
 */
async function migrateBnUSD(
  amount: bigint,
  recipient: Address,
  legacybnUSD: string,
  newbnUSD: string,
  dstChainId: SpokeChainId,
): Promise<void> {
  const result = await sodax.migration.migratebnUSD(
    {
      srcChainId: suiSpokeProvider.chainConfig.chain.id,
      srcbnUSD: legacybnUSD,
      dstbnUSD: newbnUSD,
      dstChainId: dstChainId,
      amount,
      to: recipient,
    } satisfies UnifiedBnUSDMigrateParams,
    suiSpokeProvider,
  );

  if (result.ok) {
    console.log('[migrateBnUSD] txHash', result.value);
    const [spokeTxHash, hubTxHash] = result.value;
    console.log('[migrateBnUSD] hubTxHash', hubTxHash);
    console.log('[migrateBnUSD] spokeTxHash', spokeTxHash);
  } else {
    console.error('[migrateBnUSD] error', result.error);
  }
}

/**
 * Bridge tokens from one chain to another
 * @param srcChainId - The source chain ID
 * @param srcAsset - The source asset address
 * @param amount - The amount to bridge
 * @param dstChainId - The destination chain ID
 * @param dstAsset - The destination asset address
 * @param recipient - The recipient address on the destination chain
 * @param partnerFee - Optional partner fee configuration
 */
async function bridge(
  srcChainId: SpokeChainId,
  srcAsset: string,
  amount: bigint,
  dstChainId: SpokeChainId,
  dstAsset: string,
  recipient: Hex,
  partnerFee?: PartnerFee,
): Promise<void> {
  const bridgeParams: CreateBridgeIntentParams = {
    srcChainId,
    srcAsset,
    amount,
    dstChainId,
    dstAsset,
    recipient,
  };

  // For Sui as source chain, use SuiSpokeProvider
  if (srcChainId === SUI_CHAIN_ID) {
    const result = await bridgeService.bridge({
      params: bridgeParams,
      spokeProvider: suiSpokeProvider,
      fee: partnerFee,
    });

    if (result.ok) {
      const [spokeTxHash, hubTxHash] = result.value;
      console.log('[bridge] spokeTxHash:', spokeTxHash);
      console.log('[bridge] hubTxHash:', hubTxHash);
      console.log('[bridge] Bridge transaction completed successfully');
    } else {
      console.error('[bridge] Bridge failed:', result.error);
    }
  } else {
    console.error('[bridge] Source chain not supported for bridging from this script');
  }
}

// Main function to decide which function to call
async function main() {
  console.log(process.argv);
  const functionName = process.argv[2];

  if (functionName === 'deposit') {
    const token = process.argv[3] as Hex; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    const recipient = process.argv[5] as Hex; // Get recipient address from command line argument
    await depositTo(token, amount, recipient);
  } else if (functionName === 'withdrawAsset') {
    const token = process.argv[3] as Hex; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    const recipient = process.argv[5] as Hex; // Get recipient address from command line argument
    await withdrawAsset(token, amount, recipient);
  } else if (functionName === 'supply') {
    const token = process.argv[3] as Hex; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await supply(token, amount);
  } else if (functionName === 'borrow') {
    const token = process.argv[3] as Hex; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await borrow(token, amount);
  } else if (functionName === 'withdraw') {
    const token = process.argv[3] as Hex; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await withdraw(token, amount);
  } else if (functionName === 'repay') {
    const token = process.argv[3] as Address; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await repay(token, amount);
  } else if (functionName === 'migrateBnUSD') {
    const amount = BigInt(process.argv[3]);
    const recipient = process.argv[4] as Address;
    const legacybnUSD = process.argv[5] as string;
    const newbnUSD = process.argv[6] as string;
    const dstChainID = process.argv[7] as SpokeChainId;
    await migrateBnUSD(amount, recipient, legacybnUSD, newbnUSD, dstChainID);
  } else if (functionName === 'balance') {
    const token = process.argv[3] as string;
    await getBalance(token);
  } else if (functionName === 'bridge') {
    const srcChainId = process.argv[3] as SpokeChainId;
    const srcAsset = process.argv[4] as string;
    const amount = BigInt(process.argv[5]);
    const dstChainId = process.argv[6] as SpokeChainId;
    const dstAsset = process.argv[7] as string;
    const recipient = process.argv[8] as Hex;
    const partnerFeeAddress = process.argv[9] as Hex | undefined;
    const partnerFeeAmount = process.argv[10] ? BigInt(process.argv[10]) : undefined;

    const partnerFee =
      partnerFeeAddress && partnerFeeAmount ? { address: partnerFeeAddress, amount: partnerFeeAmount } : undefined;

    await bridge(srcChainId, srcAsset, amount, dstChainId, dstAsset, recipient, partnerFee);
  } else {
    console.log(
      'Function not recognized. Please use "deposit", "withdrawAsset", "supply", "borrow", "withdraw", "repay", "migrateBnUSD", "balance", or "bridge".',
    );
    console.log('Usage examples:');
    console.log('  npm run sui deposit <token_address> <amount> <recipient_address>');
    console.log('  npm run sui withdrawAsset <token_address> <amount> <recipient_address>');
    console.log('  npm run sui supply <token_address> <amount>');
    console.log('  npm run sui borrow <token_address> <amount>');
    console.log('  npm run sui withdraw <token_address> <amount>');
    console.log('  npm run sui repay <token_address> <amount>');
    console.log(
      '  npm run sui migrateBnUSD <legacybnUSD_address> <dstChainID> <newbnUSD_address> <amount> <recipient_address>',
    );
    console.log('  npm run sui balance <token_address>');
    console.log(
      '  npm run sui bridge <srcChainId> <srcAsset> <amount> <dstChainId> <dstAsset> <recipient> [partnerFeeAddress] [partnerFeePercentage]',
    );
  }
}
main();
//npm run sui bridge sui "0xff4de2b2b57dd7611d2812d231a467d007b702a101fd5c7ad3b278257cddb507::bnusd::BNUSD" 1 "0x89.polygon" "0x39E77f86C1B1f3fbAb362A82b49D2E86C09659B4" "0x6d7b6956589c17b2755193a67bf2d4b68827e58a"
