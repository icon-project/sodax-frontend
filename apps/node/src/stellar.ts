import type { Hash, Hex, Address } from 'viem';
import {
  EvmAssetManagerService,
  EvmWalletAbstraction,
  getHubChainConfig,
  spokeChainConfig,
  SpokeService,
  StellarSpokeProvider,
  type StellarSpokeChainConfig,
  getMoneyMarketConfig,
  type EvmHubProviderConfig,
  Sodax,
  type SodaxConfig,
  EvmHubProvider,
  type SolverConfigParams,
  type HttpUrl,
} from '@sodax/sdk';

import { StellarWalletProvider, type StellarWalletConfig } from './wallet-providers/StellarWalletProvider';
import { SONIC_MAINNET_CHAIN_ID, STELLAR_MAINNET_CHAIN_ID } from '@sodax/types';
import { Address as stellarAddress } from '@stellar/stellar-sdk';
import * as dotenv from 'dotenv';
dotenv.config();

const privateKey = process.env.PRIVATE_KEY;
const IS_TESTNET = process.env.IS_TESTNET === 'true';
const HUB_RPC_URL = 'https://rpc.soniclabs.com';
const HUB_CHAIN_ID = SONIC_MAINNET_CHAIN_ID;
const STELLAR_CHAIN_ID = STELLAR_MAINNET_CHAIN_ID;
if (!privateKey) {
  throw new Error('PRIVATE_KEY environment variable is required');
}

const stellarConfig = spokeChainConfig[STELLAR_CHAIN_ID] as StellarSpokeChainConfig;
const STELLAR_SECRET_KEY = process.env.STELLAR_SECRET_KEY ?? '';
const STELLAR_SOROBAN_RPC_URL = (process.env.STELLAR_SOROBAN_RPC_URL ?? stellarConfig.sorobanRpcUrl) as HttpUrl;
const STELLAR_HORIZON_RPC_URL = (process.env.STELLAR_HORIZON_RPC_URL ?? stellarConfig.horizonRpcUrl) as HttpUrl;

// Create Stellar wallet config
const stellarWalletConfig: StellarWalletConfig = {
  type: 'PRIVATE_KEY',
  privateKey: STELLAR_SECRET_KEY as Hex,
  network: IS_TESTNET ? 'TESTNET' : 'PUBLIC',
  rpcUrl: STELLAR_SOROBAN_RPC_URL,
};

const stellarWalletProvider = new StellarWalletProvider(stellarWalletConfig);
const stellarSpokeProvider = new StellarSpokeProvider(stellarWalletProvider, stellarConfig, {
  horizonRpcUrl: STELLAR_HORIZON_RPC_URL,
  sorobanRpcUrl: STELLAR_SOROBAN_RPC_URL,
});

const moneyMarketConfig = getMoneyMarketConfig(HUB_CHAIN_ID);

const solverConfig = {
  intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef',
  solverApiEndpoint: 'https://sodax-solver-staging.iconblockchain.xyz',
  partnerFee: undefined,
} satisfies SolverConfigParams;

const hubChainConfig = getHubChainConfig(HUB_CHAIN_ID);
const hubConfig = {
  hubRpcUrl: HUB_RPC_URL,
  chainConfig: hubChainConfig,
} satisfies EvmHubProviderConfig;

const sodax = new Sodax({
  solver: solverConfig,
  moneyMarket: moneyMarketConfig,
  hubProviderConfig: hubConfig,
} satisfies SodaxConfig);

const hubProvider = new EvmHubProvider({
  hubRpcUrl: HUB_RPC_URL,
  chainConfig: hubChainConfig,
});

async function getBalance(token: string) {
  const balance = await stellarSpokeProvider.getBalance(token);
  console.log(balance);
}

async function depositTo(token: string, amount: bigint, recipient: Address) {
  const walletAddressBytes = await stellarSpokeProvider.walletProvider.getWalletAddressBytes();
  const data = EvmAssetManagerService.depositToData(
    {
      token,
      to: recipient,
      amount,
    },
    stellarSpokeProvider.chainConfig.chain.id,
  );

  const txHash = await SpokeService.deposit(
    {
      from: walletAddressBytes,
      token,
      amount,
      data,
    },
    stellarSpokeProvider,
    hubProvider,
  );

  console.log('[depositTo] txHash', txHash);
}

async function withdrawAsset(
  token: string,
  amount: bigint,
  recipient: string, // stellar address
) {
  const walletAddressBytes = await stellarSpokeProvider.walletProvider.getWalletAddressBytes();
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    stellarSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );

  const data = EvmAssetManagerService.withdrawAssetData(
    {
      token,
      to: `0x${stellarAddress.fromString(recipient).toScVal().toXDR('hex')}`,
      amount,
    },
    hubProvider,
    stellarSpokeProvider.chainConfig.chain.id,
  );
  const txHash = await SpokeService.callWallet(hubWallet, data, stellarSpokeProvider, hubProvider);

  console.log('[withdrawAsset] txHash', txHash);
}

async function supply(token: string, amount: bigint) {
  const walletAddressBytes = await stellarSpokeProvider.walletProvider.getWalletAddressBytes();
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    stellarSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );

  const data = sodax.moneyMarket.buildSupplyData(token, hubWallet, amount, stellarSpokeProvider.chainConfig.chain.id);

  const txHash = await SpokeService.deposit(
    {
      from: walletAddressBytes,
      token,
      amount,
      data,
    },
    stellarSpokeProvider,
    hubProvider,
  );

  console.log('[supply] txHash', txHash);
}

async function borrow(token: string, amount: bigint) {
  const walletAddressBytes = await stellarSpokeProvider.walletProvider.getWalletAddressBytes();
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    stellarSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );
  console.log(hubWallet);
  const data: Hex = sodax.moneyMarket.buildBorrowData(
    hubWallet,
    walletAddressBytes,
    token,
    amount,
    stellarSpokeProvider.chainConfig.chain.id,
  );

  const txHash = await SpokeService.callWallet(hubWallet, data, stellarSpokeProvider, hubProvider);

  console.log('[borrow] txHash', txHash);
}

async function withdraw(token: string, amount: bigint) {
  const walletAddressBytes = await stellarSpokeProvider.walletProvider.getWalletAddressBytes();
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    stellarSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );

  console.log('Hub wallet: ', hubWallet);

  const data: Hex = sodax.moneyMarket.buildWithdrawData(
    hubWallet,
    walletAddressBytes,
    token,
    amount,
    stellarSpokeProvider.chainConfig.chain.id,
  );

  const txHash = await SpokeService.callWallet(hubWallet, data, stellarSpokeProvider, hubProvider);

  console.log('[withdraw] txHash', txHash);
}

async function repay(token: string, amount: bigint) {
  const walletAddressBytes = await stellarSpokeProvider.walletProvider.getWalletAddressBytes();
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    stellarSpokeProvider.chainConfig.chain.id,
    walletAddressBytes,
    hubProvider,
  );
  const data: Hex = sodax.moneyMarket.buildRepayData(token, hubWallet, amount, stellarSpokeProvider.chainConfig.chain.id);

  const txHash = await SpokeService.deposit(
    {
      from: walletAddressBytes,
      token,
      amount,
      data,
    },
    stellarSpokeProvider,
    hubProvider,
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
    const recipient = process.argv[5]; // Get recipient address from command line argument
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
  } else if (functionName === 'balance') {
    const token = process.argv[3] as string;
    await getBalance(token);
  } else {
    console.log('Function not recognized. Please use "deposit" or "anotherFunction".');
  }
}

main();
