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
  SONIC_MAINNET_CHAIN_ID,
  getMoneyMarketConfig,
  SUI_MAINNET_CHAIN_ID,
  type EvmHubProviderConfig,
  type SolverConfig,
  Sodax,
  type SodaxConfig,
  type SolverConfigParams,
} from '@new-world/sdk';
import { SuiWalletProvider } from './sui-wallet-provider';

import dotenv from 'dotenv';
import { EvmWalletProvider } from './wallet-providers';
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
  solverApiEndpoint: 'https://staging-new-world.iconblockchain.xyz',
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

async function getBalance(token: string) {
  const balance = await suiSpokeProvider.getBalance(token);
  console.log('[Balance]:', balance);
}

async function depositTo(token: string, amount: bigint, recipient: Address) {
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    suiSpokeProvider.chainConfig.chain.id,
    suiSpokeProvider.getWalletAddressBytes(),
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
      from: suiSpokeProvider.getWalletAddressBytes(),
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
) {
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    suiSpokeProvider.chainConfig.chain.id,
    suiSpokeProvider.getWalletAddressBytes(),
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

async function supply(token: string, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    suiSpokeProvider.chainConfig.chain.id,
    suiSpokeProvider.getWalletAddressBytes(),
    hubProvider,
  );

  const data = sodax.moneyMarket.supplyData(token, hubWallet, amount, suiSpokeProvider.chainConfig.chain.id);

  const txHash = await SpokeService.deposit(
    {
      from: suiSpokeProvider.getWalletAddressBytes(),
      token,
      amount,
      data,
    },
    suiSpokeProvider,
    hubProvider,
  );

  console.log('[supply] txHash', txHash);
}

async function borrow(token: string, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    suiSpokeProvider.chainConfig.chain.id,
    suiSpokeProvider.getWalletAddressBytes(),
    hubProvider,
  );
  console.log(hubWallet);
  const data: Hex = sodax.moneyMarket.borrowData(
    hubWallet,
    suiSpokeProvider.getWalletAddressBytes(),
    token,
    amount,
    suiSpokeProvider.chainConfig.chain.id,
  );

  const txHash: Hash = await SpokeService.callWallet(hubWallet, data, suiSpokeProvider, hubProvider);

  console.log('[borrow] txHash', txHash);
}

async function withdraw(token: string, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    suiSpokeProvider.chainConfig.chain.id,
    suiSpokeProvider.getWalletAddressBytes(),
    hubProvider,
  );

  const data: Hex = sodax.moneyMarket.withdrawData(
    hubWallet,
    suiSpokeProvider.getWalletAddressBytes(),
    token,
    amount,
    suiSpokeProvider.chainConfig.chain.id,
  );

  const txHash: Hash = await SpokeService.callWallet(hubWallet, data, suiSpokeProvider, hubProvider);

  console.log('[withdraw] txHash', txHash);
}

async function repay(token: string, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserHubWalletAddress(
    suiSpokeProvider.chainConfig.chain.id,
    suiSpokeProvider.getWalletAddressBytes(),
    hubProvider,
  );
  const data: Hex = sodax.moneyMarket.repayData(token, hubWallet, amount, suiSpokeProvider.chainConfig.chain.id);

  const txHash: Hash = await SpokeService.deposit(
    {
      from: suiSpokeProvider.getWalletAddressBytes(),
      token,
      amount,
      data,
    },
    suiSpokeProvider,
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
  } else if (functionName === 'balance') {
    const token = process.argv[3] as string;
    await getBalance(token);
  } else {
    console.log('Function not recognized. Please use "deposit" or "anotherFunction".');
  }
}

main();
