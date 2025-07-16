import {
  CWSpokeProvider,
  type CosmosSpokeChainConfig,
  EvmAssetManagerService,
  EvmHubProvider,
  type EvmHubProviderConfig,
  EvmWalletAbstraction,
  NearSpokeChainConfig,
  Sodax,
  type SodaxConfig,
  type SolverConfigParams,
  SpokeService,
  getHubChainConfig,
  getMoneyMarketConfig,
  spokeChainConfig,
} from '@sodax/sdk';
import { CosmosWalletProvider } from './wallet-providers/CosmosWalletProvider.js';
import { InjectiveWalletProvider } from './wallet-providers/InjectiveWalletProvider.js';

import { type Address, type Hash, type Hex, toHex } from 'viem';
import { SONIC_MAINNET_CHAIN_ID, type SpokeChainId, INJECTIVE_MAINNET_CHAIN_ID, NEAR_MAINNET_CHAIN_ID } from '@sodax/types';
import dotenv from 'dotenv';
import { LocalWalletProvider, NearSpokeProvider } from '@sodax/sdk/dist/entities/near/NearSpokeProvider.js';
import fs from "node:fs";
dotenv.config();

// load PK from .env
const privateKey = process.env.NEAR_PRIVATE_KEY as Hex;
const accountId=process.env.NEAR_ACCOUNT_ID;
const IS_TESTNET = process.env.IS_TESTNET === 'true';
const HUB_RPC_URL = IS_TESTNET? 'https://sonic-testnet.drpc.org':'https://rpc.soniclabs.com';
const HUB_CHAIN_ID = SONIC_MAINNET_CHAIN_ID;

const DEFAULT_SPOKE_RPC_URL = IS_TESTNET
  ? 'https://rpc.testnet.near.org'
  : 'https://rpc.mainnet.near.org';

const DEFAULT_SPOKE_CHAIN_ID = NEAR_MAINNET_CHAIN_ID;

const SPOKE_CHAIN_ID = (process.env.NEAR_SPOKE_CHAIN_ID || DEFAULT_SPOKE_CHAIN_ID) as SpokeChainId; // Default to Injective
const SPOKE_RPC_URL = process.env.SPOKE_RPC_URL || DEFAULT_SPOKE_RPC_URL;

if (!privateKey) {
  throw new Error('NEAR_PRIVATE_KEY environment variable is required');
}
if (!accountId) {
  throw new Error('NEAR_ACCOUNT_ID environment variable is required');
}

const spokeConfig = spokeChainConfig[SPOKE_CHAIN_ID] as NearSpokeChainConfig;


const walletProvider = new LocalWalletProvider(SPOKE_RPC_URL,accountId,privateKey);

const spokeProvider = new NearSpokeProvider(walletProvider,spokeConfig);

const hubConfig = {
  hubRpcUrl: HUB_RPC_URL,
  chainConfig: getHubChainConfig(HUB_CHAIN_ID),
} satisfies EvmHubProviderConfig;

const solverConfig = {
  intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef',
  solverApiEndpoint: 'https://staging-sodax.iconblockchain.xyz',
  partnerFee: undefined,
} satisfies SolverConfigParams;

const moneyMarketConfig = getMoneyMarketConfig(HUB_CHAIN_ID);

const sodax = new Sodax({
  solver: solverConfig,
  moneyMarket: moneyMarketConfig,
  hubProviderConfig: hubConfig,
} satisfies SodaxConfig);

const evmHubProvider = new EvmHubProvider({
  hubRpcUrl: HUB_RPC_URL,
  chainConfig: getHubChainConfig(HUB_CHAIN_ID),
});

async function depositTo(token: string, amount: bigint, recipient: Address): Promise<void> {
   const walletAddressBytes = await spokeProvider.walletProvider.getWalletAddressBytes();
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    spokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    evmHubProvider,
  );
  console.log(hubWallet);
  const data = EvmAssetManagerService.depositToData(
    {
      token,
      to: recipient,
      amount,
    },
    spokeProvider.chainConfig.chain.id,
  );
  //const data="0x";
  const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
  const txHash: Hash = await SpokeService.deposit(
    {
      from: walletAddress,
      token,
      amount,
      data,
    },
    spokeProvider,
    evmHubProvider,
  );

  console.log('[depositTo] txHash', txHash);
}


async function withdrawAsset(
  token: string,
  amount: bigint,
  recipient: string, // near address
): Promise<void> {
  const data = EvmAssetManagerService.withdrawAssetData(
    {
      token,
      to: toHex(Buffer.from(recipient, 'utf-8')),
      amount,
    },
    evmHubProvider,
    spokeProvider.chainConfig.chain.id,
  );
  const walletAddressBytes = await spokeProvider.walletProvider.getWalletAddressBytes();
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    spokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    evmHubProvider,
  );

  const txHash: Hash = await SpokeService.callWallet(hubWallet, data, spokeProvider, evmHubProvider);

  console.log('[withdrawAsset] txHash', txHash);
}

async function supply(token: string, amount: bigint): Promise<void> {
  const walletAddressBytes = await spokeProvider.walletProvider.getWalletAddressBytes();
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    spokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    evmHubProvider,
  );
  console.log(hubWallet);

  const data = sodax.moneyMarket.supplyData(token, hubWallet, amount, spokeProvider.chainConfig.chain.id);
  const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

  const txHash = await SpokeService.deposit(
    {
      from: walletAddress,
      token,
      amount,
      data,
    },
    spokeProvider,
    evmHubProvider,
  );

  console.log('[supply] txHash', txHash);
}

async function borrow(token: string, amount: bigint): Promise<void> {
  const walletAddressBytes = await spokeProvider.walletProvider.getWalletAddressBytes();
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    spokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    evmHubProvider,
  );
  console.log(hubWallet);

  const data: Hex = sodax.moneyMarket.borrowData(
    hubWallet,
    walletAddressBytes,
    token,
    amount,
    spokeProvider.chainConfig.chain.id,
  );

  const txHash: Hash = await SpokeService.callWallet(hubWallet, data, spokeProvider, evmHubProvider);

  console.log('[borrow] txHash', txHash);
}

async function withdraw(token: string, amount: bigint): Promise<void> {
  const walletAddressBytes = await spokeProvider.walletProvider.getWalletAddressBytes();
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    spokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    evmHubProvider,
  );

  const data: Hex = sodax.moneyMarket.withdrawData(
    hubWallet,
    walletAddressBytes,
    token,
    amount,
    spokeProvider.chainConfig.chain.id,
  );

  const txHash: Hash = await SpokeService.callWallet(hubWallet, data, spokeProvider, evmHubProvider);

  console.log('[withdraw] txHash', txHash);
}

async function repay(token: string, amount: bigint): Promise<void> {
  const walletAddressBytes = await spokeProvider.walletProvider.getWalletAddressBytes();
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    spokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    evmHubProvider,
  );
  const data: Hex = sodax.moneyMarket.repayData(token, hubWallet, amount, spokeProvider.chainConfig.chain.id);
  const walletAddress = await spokeProvider.walletProvider.getWalletAddress();

  const txHash: Hash = await SpokeService.deposit(
    {
      from: walletAddress,
      token,
      amount,
      data,
    },
    spokeProvider,
    evmHubProvider,
  );

  console.log('[repay] txHash', txHash);
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
  } else {
    console.log('Function not recognized. Please use "deposit" or "anotherFunction".');
  }
}

main();
