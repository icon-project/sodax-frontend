import 'dotenv/config';
import type { Address, Hash, Hex } from 'viem';
import {
  EvmAssetManagerService,
  EvmHubProvider,
  EvmWalletAbstraction,
  getHubChainConfig,
  spokeChainConfig,
  SpokeService,
  type IconSpokeChainConfig,
  IconSpokeProvider,
  type IconAddress,
  getIconAddressBytes,
  getMoneyMarketConfig,
  type EvmHubProviderConfig,
  Sodax,
  type SodaxConfig,
  type MigrationParams,
  LockupPeriod,
  type UnifiedBnUSDMigrateParams,
  encodeAddress,
} from '@sodax/sdk';
import { SONIC_MAINNET_CHAIN_ID, type HubChainId, ICON_MAINNET_CHAIN_ID, type SpokeChainId } from '@sodax/types';
import { IconWalletProvider } from '@sodax/wallet-sdk-core';
import { solverConfig } from './config.js';

// load PK from .env
const privateKey = process.env.ICON_PRIVATE_KEY;

if (!privateKey) {
  throw new Error('PRIVATE_KEY environment variable is required');
}

const IS_TESTNET = process.env.IS_TESTNET === 'true';
const HUB_CHAIN_ID: HubChainId = SONIC_MAINNET_CHAIN_ID;
const HUB_RPC_URL = 'https://rpc.soniclabs.com';

const DEFAULT_SPOKE_RPC_URL = IS_TESTNET
  ? 'https://lisbon.net.solidwallet.io/api/v3'
  : 'https://ctz.solidwallet.io/api/v3';
const DEFAULT_SPOKE_CHAIN_ID = ICON_MAINNET_CHAIN_ID;

const iconSpokeWallet = new IconWalletProvider({
  privateKey: privateKey as Hex,
  rpcUrl: DEFAULT_SPOKE_RPC_URL,
});
const iconSpokeChainConfig = spokeChainConfig[DEFAULT_SPOKE_CHAIN_ID];
const iconSpokeProvider = new IconSpokeProvider(iconSpokeWallet, iconSpokeChainConfig as IconSpokeChainConfig);

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

const hubProvider = new EvmHubProvider({ config: hubConfig, configService: sodax.config });

async function depositTo(token: IconAddress, amount: bigint, recipient: Address) {
  const data = EvmAssetManagerService.depositToData(
    {
      token,
      to: recipient,
      amount,
    },
    iconSpokeChainConfig.chain.id,
    sodax.config,
  );

  const walletAddress = (await iconSpokeProvider.walletProvider.getWalletAddress()) as IconAddress;

  const txHash: Hash = await SpokeService.deposit(
    {
      from: walletAddress,
      token,
      amount,
      data: data,
    },
    iconSpokeProvider,
    hubProvider,
  );

  console.log('[depositTo] txHash', txHash);
}

async function withdrawAsset(token: IconAddress, amount: bigint, recipient: IconAddress) {
  const walletAddress = await iconSpokeProvider.walletProvider.getWalletAddress();
  const walletAddressBytes = encodeAddress(ICON_MAINNET_CHAIN_ID, walletAddress);
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    iconSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );

  const data = EvmAssetManagerService.withdrawAssetData(
    {
      token,
      to: getIconAddressBytes(recipient),
      amount,
    },
    hubProvider,
    iconSpokeChainConfig.chain.id,
  );
  const txHash: Hash = await SpokeService.callWallet(hubWallet, data, iconSpokeProvider, hubProvider);

  console.log('[withdrawAsset] txHash', txHash);
}

async function supply(token: IconAddress, amount: bigint) {
  const walletAddress = await iconSpokeProvider.walletProvider.getWalletAddress();
  const walletAddressBytes = encodeAddress(ICON_MAINNET_CHAIN_ID, walletAddress);
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    iconSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );

  const data = sodax.moneyMarket.buildSupplyData(iconSpokeChainConfig.chain.id, token, amount, hubWallet);

  const txHash = await SpokeService.deposit(
    {
      from: walletAddress,
      token,
      amount,
      data,
    },
    iconSpokeProvider,
    hubProvider,
  );

  console.log('[supply] txHash', txHash);
}

async function borrow(token: IconAddress, amount: bigint) {
  const walletAddress = await iconSpokeProvider.walletProvider.getWalletAddress();
  const walletAddressBytes = encodeAddress(ICON_MAINNET_CHAIN_ID, walletAddress);
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    iconSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );
  const data: Hex = sodax.moneyMarket.buildBorrowData(
    hubWallet,
    walletAddressBytes,
    token,
    amount,
    iconSpokeChainConfig.chain.id,
  );

  const txHash: Hash = await SpokeService.callWallet(hubWallet, data, iconSpokeProvider, hubProvider);

  console.log('[borrow] txHash', txHash);
}

async function withdraw(token: IconAddress, amount: bigint) {
  const walletAddress = await iconSpokeProvider.walletProvider.getWalletAddress();
  const walletAddressBytes = encodeAddress(ICON_MAINNET_CHAIN_ID, walletAddress);
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    iconSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );

  const data: Hex = sodax.moneyMarket.buildWithdrawData(
    hubWallet,
    walletAddressBytes,
    token,
    amount,
    iconSpokeChainConfig.chain.id,
  );

  const txHash: Hash = await SpokeService.callWallet(hubWallet, data, iconSpokeProvider, hubProvider);

  console.log('[withdraw] txHash', txHash);
}

async function repay(token: IconAddress, amount: bigint) {
  const walletAddress = await iconSpokeProvider.walletProvider.getWalletAddress();
  const walletAddressBytes = encodeAddress(ICON_MAINNET_CHAIN_ID, walletAddress);
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    iconSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );
  const data: Hex = sodax.moneyMarket.buildRepayData(iconSpokeChainConfig.chain.id, token, amount, hubWallet);

  const txHash: Hash = await SpokeService.deposit(
    {
      from: walletAddress,
      token,
      amount,
      data,
    },
    iconSpokeProvider,
    hubProvider,
  );

  console.log('[repay] txHash', txHash);
}

/**
 * Migrates wICX tokens from ICON to the hub chain.
 * This function handles the migration of wICX tokens to SODA tokens on the hub chain.
 *
 * @param wICX - The ICON address of the wICX token to migrate
 * @param amount - The amount of wICX tokens to migrate
 * @param recipient - The address that will receive the migrated SODA tokens
 */
async function migrateIcxToSoda(amount: bigint, recipient: Address): Promise<void> {
  const params = {
    address: iconSpokeChainConfig.nativeToken,
    amount,
    to: recipient,
  } satisfies MigrationParams;

  const result = await sodax.migration.migrateIcxToSoda(params, iconSpokeProvider);

  if (result.ok) {
    console.log('[migrate] txHash', result.value);
    const [hubTxHash, spokeTxHash] = result.value;
    console.log('[migrate] hubTxHash', hubTxHash);
    console.log('[migrate] spokeTxHash', spokeTxHash);
  } else {
    console.error('[migrate] error', result.error);
  }
}

/**
 * Migrates legacy bnUSD tokens to new bnUSD tokens.
 * This function handles the migration of legacy bnUSD tokens to new bnUSD tokens.
 *
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
      srcChainId: iconSpokeChainConfig.chain.id,
      dstChainId: dstChainId,
      srcbnUSD: legacybnUSD,
      dstbnUSD: newbnUSD,
      amount,
      to: recipient,
    } satisfies UnifiedBnUSDMigrateParams,
    iconSpokeProvider,
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
 * Migrates Icon BALN tokens to Sonic BALN tokens.
 * This function handles the migration of BALN tokens to SODA tokens.
 *
 * @param amount - The amount of BALN tokens to migrate
 * @param recipient - The address that will receive the migrated BALN tokens
 * @param lockupPeriod - The lockup period for the BALN tokens
 */
async function migrateBaln(amount: bigint, recipient: Address, lockupPeriod: LockupPeriod): Promise<void> {
  const result = await sodax.migration.migrateBaln(
    {
      lockupPeriod,
      stake: false,
      amount,
      to: recipient,
    },
    iconSpokeProvider,
  );

  if (result.ok) {
    console.log('[migrateBaln] txHash', result.value);
    const [spokeTxHash, hubTxHash] = result.value;
    console.log('[migrateBaln] hubTxHash', hubTxHash);
    console.log('[migrateBaln] spokeTxHash', spokeTxHash);
  } else {
    console.error('[migrateBaln] error', result.error);
  }
}

// Main function to decide which function to call
async function main() {
  const functionName = process.argv[2]; // Get function name from command line argument

  if (functionName === 'deposit') {
    const token = process.argv[3] as IconAddress; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    const recipient = process.argv[5] as Address; // Get recipient address from command line argument
    await depositTo(token, amount, recipient);
  } else if (functionName === 'withdrawAsset') {
    const token = process.argv[3] as IconAddress; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    const recipient = process.argv[5] as IconAddress; // Get recipient address from command line argument
    await withdrawAsset(token, amount, recipient);
  } else if (functionName === 'supply') {
    const token = process.argv[3] as IconAddress; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await supply(token, amount);
  } else if (functionName === 'borrow') {
    const token = process.argv[3] as IconAddress; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await borrow(token, amount);
  } else if (functionName === 'withdraw') {
    const token = process.argv[3] as IconAddress; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await withdraw(token, amount);
  } else if (functionName === 'repay') {
    const token = process.argv[3] as IconAddress; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await repay(token, amount);
  } else if (functionName === 'migrateIcxToSoda') {
    const amount = BigInt(process.argv[3]); // Get amount from command line argument
    const recipient = process.argv[4] as Address; // Get recipient address from command line argument
    await migrateIcxToSoda(amount, recipient);
  } else if (functionName === 'migrateBnUSD') {
    const amount = BigInt(process.argv[3]); // Get amount from command line argument
    const recipient = process.argv[4] as Address; // Get recipient address from command line argument
    const legacybnUSD = process.argv[5] as string; // Get legacy bnUSD address from command line argument
    const newbnUSD = process.argv[6] as string; // Get new bnUSD address from command line argument
    const dstChainID = process.argv[7] as SpokeChainId; // Get destination chain ID from command line argument
    await migrateBnUSD(amount, recipient, legacybnUSD, newbnUSD, dstChainID);
  } else if (functionName === 'migrateBaln') {
    const amount = BigInt(process.argv[3]); // Get amount from command line argument
    const recipient = process.argv[4] as Address; // Get recipient address from command line argument
    let lockupPeriod = LockupPeriod.NO_LOCKUP;
    if (process.argv.length >= 6) {
      lockupPeriod = Number.parseInt(process.argv[5]) as LockupPeriod; // Get lockup period from command line argument
    }

    await migrateBaln(amount, recipient, lockupPeriod);
  } else {
    console.log(
      'Function not recognized. Please use one of: "deposit", "withdrawAsset", "supply", "borrow", "withdraw", "repay", "migrate", "migrateBnUSD", or "migrateBaln".',
    );
    console.log('Usage examples:');
    console.log('  npm run icon migrate <amount> <recipient_address>');
    console.log(
      '  npm run icon migrateBnUSD <srcChainID> <legacybnUSD_address> <newbnUSD_address> <amount> <recipient_address>',
    );
    console.log('  npm run icon migrateBaln <amount> <recipient_address> <lockup_period>');
    console.log('  npm run icon deposit <token_address> <amount> <recipient_address>');
    console.log('  npm run icon supply <token_address> <amount>');
  }
}

main();
