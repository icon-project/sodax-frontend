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
} from '@sodax/sdk';

import { StacksWalletProvider } from './wallet-providers/StacksWalletProvider.js';
import { defaultUrlFromNetwork, networkFrom, STACKS_MAINNET, StacksNetwork } from '@stacks/network';
import { SONIC_MAINNET_CHAIN_ID, type HubChainId, STACKS_MAINNET_CHAIN_ID } from '@sodax/types';

// load PK from .env
const privateKey = process.env.PRIVATE_KEY;

if (!privateKey) {
  throw new Error('PRIVATE_KEY environment variable is required');
}

const IS_TESTNET = process.env.IS_TESTNET === 'true';
const HUB_CHAIN_ID: HubChainId = SONIC_MAINNET_CHAIN_ID;
const HUB_RPC_URL = 'https://rpc.soniclabs.com';

const stacksNetwork: StacksNetwork = IS_TESTNET ? networkFrom('testnet') : networkFrom('mainnet');
const DEFAULT_SPOKE_RPC_URL = defaultUrlFromNetwork(stacksNetwork);
const DEFAULT_SPOKE_CHAIN_ID = STACKS_MAINNET_CHAIN_ID;

const stacksWallet = new StacksWalletProvider(privateKey, stacksNetwork);
const stacksSpokeChainConfig = spokeChainConfig[DEFAULT_SPOKE_CHAIN_ID];
const stacksSpokeProvider = new StacksSpokeProvider(stacksSpokeChainConfig, stacksWallet, stacksNetwork);

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
  const data = EvmAssetManagerService.depositToData(
    {
      token,
      to: recipient,
      amount,
    },
    stacksSpokeChainConfig.chain.id,
  );
  const walletAddress = (await stacksSpokeProvider.walletProvider.getWalletAddress());
  const txHash: string = await SpokeService.deposit(
    {
      from: walletAddress,
      token,
      amount,
      data,
    },
    stacksSpokeProvider,
    hubProvider,
  );

  console.log('[depositTo] txHash', txHash);

  const txReceipt: Boolean = await waitForStacksTransaction(txHash, stacksNetwork);

  if (txReceipt) {
    console.log('[depositTo] Success');
  }
}

async function withdrawAsset(token: Address, amount: bigint, recipient: string) {
  const walletAddressBytes = await stacksSpokeProvider.walletProvider.getWalletAddressBytes();
  
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    stacksSpokeChainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );

  const data = EvmAssetManagerService.withdrawAssetData(
    {
      token,
      to: serializeAddressData(recipient),
      amount,
    },
    hubProvider,
    stacksSpokeChainConfig.chain.id,
  );

  const txHash = await SpokeService.callWallet(
    hubWallet,
    data,
    stacksSpokeProvider,
    hubProvider,
  );

  console.log('[withdrawAsset] txHash', txHash);

  const txReceipt: Boolean = await waitForStacksTransaction(txHash, stacksNetwork);

  if (txReceipt) {
    console.log('Success');
  }
}

async function supply(token: Address, amount: bigint) {
  const walletAddressBytes = await stacksSpokeProvider.walletProvider.getWalletAddressBytes();
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    stacksSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );

  const data = sodax.moneyMarket.supplyData(
    token,
    hubWallet,
    amount,
    stacksSpokeProvider.chainConfig.chain.id,
  );

  const walletAddress = (await stacksSpokeProvider.walletProvider.getWalletAddress());
  const txHash: string = await SpokeService.deposit(
    {
      from: walletAddress,
      token,
      amount,
      data,
    },
    stacksSpokeProvider,
    hubProvider,
  );

  console.log('[supply] txHash', txHash);

  const txReceipt: Boolean = await waitForStacksTransaction(txHash, stacksNetwork);

  if (txReceipt) {
    console.log('Success');
  }
}

async function borrow(token: Address, amount: bigint) {
  const walletAddressBytes = await stacksSpokeProvider.walletProvider.getWalletAddressBytes();
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    stacksSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );

  const data: Hex = sodax.moneyMarket.borrowData(
    hubWallet,
    walletAddressBytes,
    token,
    amount,
    stacksSpokeProvider.chainConfig.chain.id
  );
  const txHash = await SpokeService.callWallet(hubWallet, data, stacksSpokeProvider, hubProvider);

  console.log('[borrow] txHash', txHash);

  const txReceipt: Boolean = await waitForStacksTransaction(txHash, stacksNetwork);

  if (txReceipt) {
    console.log('Success');
  }
}

async function withdraw(token: Address, amount: bigint) {
  const walletAddressBytes = await stacksSpokeProvider.walletProvider.getWalletAddressBytes();
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    stacksSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );

  const data: Hex = sodax.moneyMarket.withdrawData(
    hubWallet,
    walletAddressBytes,
    token,
    amount,
    stacksSpokeProvider.chainConfig.chain.id)

  const txHash = await SpokeService.callWallet(hubWallet, data, stacksSpokeProvider, hubProvider);

  console.log('[withdraw] txHash', txHash);

  const txReceipt: Boolean = await waitForStacksTransaction(txHash, stacksNetwork);

  if (txReceipt) {
    console.log('Success');
  }
}

async function repay(token: Address, amount: bigint) {
  const walletAddressBytes = await stacksSpokeProvider.walletProvider.getWalletAddressBytes();
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    stacksSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );

  const data: Hex = sodax.moneyMarket.repayData(
    token,
    hubWallet,
    amount,
    stacksSpokeProvider.chainConfig.chain.id,
  );

  const walletAddress = (await stacksSpokeProvider.walletProvider.getWalletAddress());
  const txHash: string = await SpokeService.deposit(
    {
      from: walletAddress,
      token,
      amount,
      data,
    },
    stacksSpokeProvider,
    hubProvider,
  );

  console.log('[repay] txHash', txHash);

  const txReceipt: Boolean = await waitForStacksTransaction(txHash, stacksNetwork);

  if (txReceipt) {
    console.log('Success');
  }
}

async function sendRequest(tx_hash: string, chain_id: number): Promise<void> {
  const url: string = 'http://i8ea46lgrfs2e3nlg9zgblw3r7c146o2.lambda-url.us-east-2.localhost.localstack.cloud:4566/';

  const requestData = {
    action: 'submit',
    params: {
      chain_id,
      tx_hash,
    },
  };

  try {
    const response: Response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
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
  } else if (functionName === 'send') {
    const tx_hash = process.argv[3] as string; // Get token address from command line argument
    const chain_id = Number.parseInt(process.argv[4]); // Get token address from command line argument
    await sendRequest(tx_hash, chain_id);
  } else {
    console.log('Function not recognized. Please use "deposit" or "anotherFunction".');
  }
}

main();
