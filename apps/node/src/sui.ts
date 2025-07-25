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
  type SolverConfigParams,
  BnUSDMigrationService,
  type BnUSDMigrateParams,
  encodeAddress,
} from '@sodax/sdk';
import { SONIC_MAINNET_CHAIN_ID, SUI_MAINNET_CHAIN_ID, type SpokeChainId } from '@sodax/types';
import { SuiWalletProvider } from './sui-wallet-provider.js';

import dotenv from 'dotenv';
import { EvmWalletProvider } from './wallet-providers/EvmWalletProvider.js';
dotenv.config();
// load PK from .env
const privateKey = process.env.PRIVATE_KEY;
const IS_TESTNET = process.env.IS_TESTNET === 'true';
const HUB_RPC_URL = IS_TESTNET ? 'https://rpc.blaze.soniclabs.com' : 'https://rpc.soniclabs.com';
const HUB_CHAIN_ID = SONIC_MAINNET_CHAIN_ID;
const SUI_CHAIN_ID = SUI_MAINNET_CHAIN_ID;
const SUI_RPC_URL = IS_TESTNET ? 'https://fullnode.testnet.sui.io' : 'https://fullnode.mainnet.sui.io';

if (!privateKey) {
  throw new Error('PRIVATE_KEY environment variable is required');
}

const hubEvmWallet = new EvmWalletProvider(privateKey as Hex, HUB_CHAIN_ID, HUB_RPC_URL);

const hubChainConfig = getHubChainConfig(HUB_CHAIN_ID);
const hubProvider = new EvmHubProvider({
  hubRpcUrl: HUB_RPC_URL,
  chainConfig: hubChainConfig,
});

const hubConfig = {
  hubRpcUrl: HUB_RPC_URL,
  chainConfig: getHubChainConfig(HUB_CHAIN_ID),
} satisfies EvmHubProviderConfig;

const solverConfig = {
  intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef',
  solverApiEndpoint: 'https://sodax-solver-staging.iconblockchain.xyz',
  partnerFee: undefined,
} satisfies SolverConfigParams;

const moneyMarketConfig = getMoneyMarketConfig(HUB_CHAIN_ID);

const sodax = new Sodax({
  solver: solverConfig,
  moneyMarket: moneyMarketConfig,
  hubProviderConfig: hubConfig,
} satisfies SodaxConfig);

const suiConfig = spokeChainConfig[SUI_CHAIN_ID] as SuiSpokeChainConfig;
const suiWalletMnemonics = process.env.MNEMONICS;

if (!suiWalletMnemonics) {
  throw new Error('SUI_MNEMONICS environment variable is required');
}
const suiWalletProvider = new SuiWalletProvider(SUI_RPC_URL, suiWalletMnemonics);
const suiSpokeProvider = new SuiSpokeProvider(suiConfig, suiWalletProvider);
const walletAddress = await suiWalletProvider.getWalletAddress();
console.log('[walletAddress]:', walletAddress);
async function getBalance(token: string) {
  const balance = await suiSpokeProvider.getBalance(token);
  console.log('[Balance]:', balance);
}

async function depositTo(token: string, amount: bigint, recipient: Address): Promise<void> {
  const walletAddressBytes = await suiSpokeProvider.getWalletAddressBytes();
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
  );

  const txHash: Hash = await SpokeService.deposit(
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
  const walletAddressBytes = await suiSpokeProvider.getWalletAddressBytes();
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
  const txHash: Hash = await SpokeService.callWallet(hubWallet, data, suiSpokeProvider, hubProvider);

  console.log('[withdrawAsset] txHash', txHash);
}

async function supply(token: string, amount: bigint): Promise<void> {
  const walletAddressBytes = await suiSpokeProvider.getWalletAddressBytes();
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    suiSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );

  const data = sodax.moneyMarket.buildSupplyData(token, hubWallet, amount, suiSpokeProvider.chainConfig.chain.id);

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
  const walletAddressBytes = await suiSpokeProvider.getWalletAddressBytes();
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

  const txHash: Hash = await SpokeService.callWallet(hubWallet, data, suiSpokeProvider, hubProvider);

  console.log('[borrow] txHash', txHash);
}

async function withdraw(token: string, amount: bigint): Promise<void> {
  const walletAddressBytes = await suiSpokeProvider.getWalletAddressBytes();
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

  const txHash: Hash = await SpokeService.callWallet(hubWallet, data, suiSpokeProvider, hubProvider);

  console.log('[withdraw] txHash', txHash);
}

async function repay(token: string, amount: bigint): Promise<void> {
  const walletAddressBytes = await suiSpokeProvider.getWalletAddressBytes();
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    suiSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );
  const data: Hex = sodax.moneyMarket.buildRepayData(token, hubWallet, amount, suiSpokeProvider.chainConfig.chain.id);

  const txHash: Hash = await SpokeService.deposit(
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
 * This function handles the migration of legacy bnUSD tokens to new bnUSD tokens.
 *
 * @param legacybnUSD - The address of the legacy bnUSD token to migrate
 * @param dstChainID - The destination chain ID where the new bnUSD token exists
 * @param newbnUSD - The address of the new bnUSD token to receive
 * @param amount - The amount of legacy bnUSD tokens to migrate
 * @param recipient - The address that will receive the migrated new bnUSD tokens
 */
async function migrateBnUSD(
  legacybnUSD: string,
  dstChainID: SpokeChainId,
  newbnUSD: string,
  amount: bigint,
  recipient: Address,
): Promise<void> {
  const bnUSDMigrationService = new BnUSDMigrationService(hubProvider);

  const params: BnUSDMigrateParams = {
    srcChainID: suiSpokeProvider.chainConfig.chain.id,
    legacybnUSD,
    newbnUSD,
    amount,
    to: encodeAddress(dstChainID, recipient),
    dstChainID: dstChainID,
  };

  const migrationData = bnUSDMigrationService.migrateData(params);

  const walletAddressBytes = await suiSpokeProvider.getWalletAddressBytes();

  const txHash: Hash = await SpokeService.deposit(
    {
      from: walletAddressBytes,
      token: legacybnUSD as Hex,
      amount,
      data: migrationData,
    },
    suiSpokeProvider,
    hubProvider,
  );

  console.log('[migrateBnUSD] txHash', txHash);
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
    const legacybnUSD = process.argv[3] as string;
    const dstChainID = process.argv[4] as SpokeChainId;
    const newbnUSD = process.argv[5] as string;
    const amount = BigInt(process.argv[6]);
    const recipient = process.argv[7] as Address;
    await migrateBnUSD(legacybnUSD, dstChainID, newbnUSD, amount, recipient);
  } else if (functionName === 'balance') {
    const token = process.argv[3] as string;
    await getBalance(token);
  } else {
    console.log(
      'Function not recognized. Please use "deposit", "withdrawAsset", "supply", "borrow", "withdraw", "repay", "migrateBnUSD", or "balance".',
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
  }
}

main();
