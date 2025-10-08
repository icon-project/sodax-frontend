import type { Address, Hex } from 'viem';
import {
  EvmAssetManagerService,
  EvmHubProvider,
  EvmWalletAbstraction,
  getHubChainConfig,
  spokeChainConfig,
  SpokeService,
  getMoneyMarketConfig,
  type EvmHubProviderConfig,
  Sodax,
  type SodaxConfig,
  type SolverConfigParams,
  StacksSpokeProvider,
  waitForStacksTransaction,
  serializeAddressData,
  encodeAddress,
} from '@sodax/sdk';
import dotenv from 'dotenv';
dotenv.config();

import { StacksWalletProvider } from '@sodax/wallet-sdk-core';
import { SONIC_MAINNET_CHAIN_ID, type HubChainId, STACKS_MAINNET_CHAIN_ID } from '@sodax/types';

// load PK from .env
const privateKey = process.env.PRIVATE_KEY;

if (!privateKey) {
  throw new Error('PRIVATE_KEY environment variable is required');
}

const IS_TESTNET = process.env.IS_TESTNET === 'true';
const HUB_CHAIN_ID: HubChainId = SONIC_MAINNET_CHAIN_ID;
const HUB_RPC_URL = IS_TESTNET ? 'https://rpc.testnet.soniclabs.com' : 'https://rpc.soniclabs.com';

const SPOKE_RPC_URL = IS_TESTNET ? 'https://api.testnet.hiro.so' : 'https://api.mainnet.hiro.so';
const SPOKE_CHAIN_ID = STACKS_MAINNET_CHAIN_ID;

const stacksNetwork = IS_TESTNET ? 'testnet' : 'mainnet';
const stacksWalletProvider = new StacksWalletProvider(privateKey, stacksNetwork);
const stacksSpokeChainConfig = spokeChainConfig[SPOKE_CHAIN_ID];
const stacksSpokeProvider = new StacksSpokeProvider(stacksSpokeChainConfig, stacksWalletProvider, stacksNetwork, SPOKE_RPC_URL);

const hubConfig = {
  hubRpcUrl: HUB_RPC_URL,
  chainConfig: getHubChainConfig(SONIC_MAINNET_CHAIN_ID),
} satisfies EvmHubProviderConfig;
const hubProvider = new EvmHubProvider(hubConfig);

const moneyMarketConfig = getMoneyMarketConfig(HUB_CHAIN_ID);

const solverConfig = {
  intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef', // mainnet
  solverApiEndpoint: 'https://sodax-solver-staging.iconblockchain.xyz',
  partnerFee: undefined,
} satisfies SolverConfigParams;

const sodax = new Sodax({
  solver: solverConfig,
  moneyMarket: moneyMarketConfig,
  hubProviderConfig: hubConfig,
} satisfies SodaxConfig);


async function depositTo(token: string, amount: bigint, recipient: Address) {
  const walletAddress = await stacksSpokeProvider.walletProvider.getWalletAddress();
  const walletAddressBytes = encodeAddress(STACKS_MAINNET_CHAIN_ID, walletAddress);
  const data = EvmAssetManagerService.depositToData(
    {
      token,
      to: recipient,
      amount,
    },
    stacksSpokeChainConfig.chain.id,
  );

  const txHash: string = await SpokeService.deposit(
    {
      from: walletAddressBytes,
      token,
      amount,
      data,
      
    },
    stacksSpokeProvider,
    hubProvider,
  );

  console.log('[depositTo] txHash', txHash);

  const txReceipt: Boolean = await waitForStacksTransaction(txHash, SPOKE_RPC_URL);

  if (txReceipt) {
    console.log('[depositTo] Success');
  }
}

async function withdrawAsset(token: Address, amount: bigint, recipient: string) {
  const walletAddress = await stacksSpokeProvider.walletProvider.getWalletAddress();
  const walletAddressBytes = encodeAddress(STACKS_MAINNET_CHAIN_ID, walletAddress);

  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    stacksSpokeChainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );

  console.log('[withdrawAsset] hubWallet', hubWallet);

  const data = EvmAssetManagerService.withdrawAssetData(
    {
      token,
      to: serializeAddressData(recipient),
      amount,
    },
    hubProvider,
    stacksSpokeChainConfig.chain.id,
  );

  console.log('[withdrawAsset] data', data);

  const txHash = await SpokeService.callWallet(
    hubWallet,
    data,
    stacksSpokeProvider,
    hubProvider,
    false,
    true
  );

  console.log('[withdrawAsset] txHash', txHash);

  const txReceipt: Boolean = await waitForStacksTransaction(txHash, SPOKE_RPC_URL);

  if (txReceipt) {
    console.log('Success');
  }
}

async function supply(token: Address, amount: bigint) {
  const walletAddress = await stacksSpokeProvider.walletProvider.getWalletAddress();
  const walletAddressBytes = encodeAddress(STACKS_MAINNET_CHAIN_ID, walletAddress);
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    stacksSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );

  const data = sodax.moneyMarket.buildSupplyData(
    token,
    hubWallet,
    amount,
    stacksSpokeProvider.chainConfig.chain.id,
  );

  const txHash: string = await SpokeService.deposit(
    {
      from: walletAddressBytes,
      token,
      amount,
      data,
    },
    stacksSpokeProvider,
    hubProvider,
  );

  console.log('[supply] txHash', txHash);

  const txReceipt: Boolean = await waitForStacksTransaction(txHash, SPOKE_RPC_URL);

  if (txReceipt) {
    console.log('Success');
  }
}

async function borrow(token: Address, amount: bigint) {
  const walletAddress = await stacksSpokeProvider.walletProvider.getWalletAddress();
  const walletAddressBytes = encodeAddress(STACKS_MAINNET_CHAIN_ID, walletAddress);
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    stacksSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );

  const data: Hex = sodax.moneyMarket.buildBorrowData(
    hubWallet,
    walletAddressBytes,
    token,
    amount,
    stacksSpokeProvider.chainConfig.chain.id
  );
  const txHash = await SpokeService.callWallet(hubWallet, data, stacksSpokeProvider, hubProvider);

  console.log('[borrow] txHash', txHash);

  const txReceipt: Boolean = await waitForStacksTransaction(txHash, SPOKE_RPC_URL);

  if (txReceipt) {
    console.log('Success');
  }
}

async function withdraw(token: Address, amount: bigint) {
  const walletAddress = await stacksSpokeProvider.walletProvider.getWalletAddress();
  const walletAddressBytes = encodeAddress(STACKS_MAINNET_CHAIN_ID, walletAddress);

  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    stacksSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );

  const data: Hex = sodax.moneyMarket.buildWithdrawData(
    hubWallet,
    walletAddressBytes,
    token,
    amount,
    stacksSpokeProvider.chainConfig.chain.id)

  const txHash = await SpokeService.callWallet(hubWallet, data, stacksSpokeProvider, hubProvider);

  console.log('[withdraw] txHash', txHash);

  const txReceipt: Boolean = await waitForStacksTransaction(txHash, SPOKE_RPC_URL);

  if (txReceipt) {
    console.log('Success');
  }
}

async function repay(token: Address, amount: bigint) {
  const walletAddress = await stacksSpokeProvider.walletProvider.getWalletAddress();
  const walletAddressBytes = encodeAddress(STACKS_MAINNET_CHAIN_ID, walletAddress);

  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    stacksSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );

  const data: Hex = sodax.moneyMarket.buildRepayData(
    token,
    hubWallet,
    amount,
    stacksSpokeProvider.chainConfig.chain.id,
  );

  const txHash: string = await SpokeService.deposit(
    {
      from: walletAddressBytes,
      token,
      amount,
      data,
    },
    stacksSpokeProvider,
    hubProvider,
  );

  console.log('[repay] txHash', txHash);

  const txReceipt: Boolean = await waitForStacksTransaction(txHash, SPOKE_RPC_URL);

  if (txReceipt) {
    console.log('Success');
  }
}

// Main function to decide which function to call
async function main() {
  const functionName = process.argv[2]; // Get function name from command line argument

  if (functionName === 'deposit') {
    const token = process.argv[3] as Address; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    const recipient = process.argv[5] as Address; // Get recipient address from command line argument
    await depositTo(token, amount, recipient);
  } else if (functionName === 'withdrawAsset') {
    const token = process.argv[3] as Address; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    const recipient = process.argv[5] as Address; // Get recipient address from command line argument
    await withdrawAsset(token, amount, recipient);
  } else if (functionName === 'supply') {
    const token = process.argv[3] as Address; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await supply(token, amount);
  } else if (functionName === 'borrow') {
    const token = process.argv[3] as Address; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await borrow(token, amount);
  } else if (functionName === 'withdraw') {
    const token = process.argv[3] as Address; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await withdraw(token, amount);
  } else if (functionName === 'repay') {
    const token = process.argv[3] as Address; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await repay(token, amount);
  } 
  else {
    console.log('Function not recognized. Please use "deposit" or "anotherFunction".');
  }
}

main();