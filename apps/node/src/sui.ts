import type { Address, Hash, Hex } from 'viem';
import {
  EvmAssetManagerService,
  EvmHubProvider,
  type MoneyMarketConfig,
  MoneyMarketService,
  EvmWalletAbstraction,
  EvmWalletProvider,
  getHubChainConfig,
  spokeChainConfig,
  SpokeService,
  type SuiSpokeChainConfig,
  SuiSpokeProvider,
  SuiWalletProvider,
  SONIC_TESTNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  getMoneyMarketConfig,
  SUI_TESTNET_CHAIN_ID,
  SUI_MAINNET_CHAIN_ID,
} from '@new-world/sdk';

import dotenv from 'dotenv';
dotenv.config();
// load PK from .env
const privateKey = process.env.PRIVATE_KEY;
const IS_TESTNET = process.env.IS_TESTNET === 'true';
const HUB_RPC_URL = IS_TESTNET ? 'https://rpc.blaze.soniclabs.com' : 'https://rpc.soniclabs.com';
const HUB_CHAIN_ID = IS_TESTNET ? SONIC_TESTNET_CHAIN_ID : SONIC_MAINNET_CHAIN_ID;
const SUI_CHAIN_ID = IS_TESTNET ? SUI_TESTNET_CHAIN_ID : SUI_MAINNET_CHAIN_ID;
const SUI_RPC_URL = IS_TESTNET ? 'https://fullnode.testnet.sui.io' : 'https://fullnode.mainnet.sui.io';

if (!privateKey) {
  throw new Error('PRIVATE_KEY environment variable is required');
}

const hubEvmWallet = new EvmWalletProvider({
  chain: HUB_CHAIN_ID,
  privateKey: privateKey as Hex,
  provider: HUB_RPC_URL,
});

const sonicHubChainConfig = getHubChainConfig(HUB_CHAIN_ID);
const sonicEvmHubProvider = new EvmHubProvider(hubEvmWallet, sonicHubChainConfig);

const suiConfig = spokeChainConfig[SUI_CHAIN_ID] as SuiSpokeChainConfig;
const suiWalletMnemonics = process.env.MNEMONICS;

if (!suiWalletMnemonics) {
  throw new Error('SUI_MNEMONICS environment variable is required');
}
const suiwalletProvider = new SuiWalletProvider(SUI_RPC_URL, suiWalletMnemonics);
const suiSpokeProvider = new SuiSpokeProvider(suiConfig, suiwalletProvider);

const moneyMarketConfig: MoneyMarketConfig = getMoneyMarketConfig(HUB_CHAIN_ID);

async function getBalance(token: string) {
  const balance = await suiSpokeProvider.getBalance(token);
  console.log('[Balance]:', balance);
}

async function depositTo(token: string, amount: bigint, recipient: Address) {
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    suiSpokeProvider.chainConfig.chain.id,
    suiSpokeProvider.getWalletAddressBytes(),
    sonicEvmHubProvider,
  );
  console.log(suiSpokeProvider.getWalletAddress())
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
      token,
      amount,
      data,
    },
    suiSpokeProvider,
    sonicEvmHubProvider,
  );

  console.log('[depositTo] txHash', txHash);
}

async function withdrawAsset(
  token: string,
  amount: bigint,
  recipient: string, // sui address
) {
  const data = EvmAssetManagerService.withdrawAssetData(
    {
      token,
      to: SuiSpokeProvider.getAddressBCSBytes(recipient),
      amount,
    },
    sonicEvmHubProvider,
    suiSpokeProvider.chainConfig.chain.id,
  );
  const txHash: Hash = await SpokeService.callWallet(
    suiSpokeProvider.getWalletAddressBytes(),
    data,
    suiSpokeProvider,
    sonicEvmHubProvider,
  );

  console.log('[withdrawAsset] txHash', txHash);
}

async function supply(token: string, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    suiSpokeProvider.chainConfig.chain.id,
    suiSpokeProvider.getWalletAddressBytes(),
    sonicEvmHubProvider,
  );

  const data = MoneyMarketService.supplyData(
    token,
    hubWallet,
    amount,
    suiSpokeProvider.chainConfig.chain.id,
    moneyMarketConfig,
  );

  const txHash = await SpokeService.deposit(
    {
      from: suiSpokeProvider.getWalletAddressBytes(),
      token,
      amount,
      data,
    },
    suiSpokeProvider,
    sonicEvmHubProvider,
  );

  console.log('[supply] txHash', txHash);
}

async function borrow(token: string, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    suiSpokeProvider.chainConfig.chain.id,
    suiSpokeProvider.getWalletAddressBytes(),
    sonicEvmHubProvider,
  );
  console.log(hubWallet);
  const data: Hex = MoneyMarketService.borrowData(
    hubWallet,
    suiSpokeProvider.getWalletAddressBytes(),
    token,
    amount,
    suiSpokeProvider.chainConfig.chain.id,
    sonicEvmHubProvider,
    moneyMarketConfig,
  );

  const txHash: Hash = await SpokeService.callWallet(
    suiSpokeProvider.getWalletAddressBytes(),
    data,
    suiSpokeProvider,
    sonicEvmHubProvider,
  );

  console.log('[borrow] txHash', txHash);
}

async function withdraw(token: string, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    suiSpokeProvider.chainConfig.chain.id,
    suiSpokeProvider.getWalletAddressBytes(),
    sonicEvmHubProvider,
  );

  const data: Hex = MoneyMarketService.withdrawData(
    hubWallet,
    suiSpokeProvider.getWalletAddressBytes(),
    token,
    amount,
    suiSpokeProvider.chainConfig.chain.id,
    sonicEvmHubProvider,
    moneyMarketConfig,
  );

  const txHash: Hash = await SpokeService.callWallet(
    suiSpokeProvider.getWalletAddressBytes(),
    data,
    suiSpokeProvider,
    sonicEvmHubProvider,
  );

  console.log('[withdraw] txHash', txHash);
}

async function repay(token: string, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    suiSpokeProvider.chainConfig.chain.id,
    suiSpokeProvider.getWalletAddressBytes(),
    sonicEvmHubProvider,
  );
  const data: Hex = MoneyMarketService.repayData(
    token,
    hubWallet,
    amount,
    suiSpokeProvider.chainConfig.chain.id,
    moneyMarketConfig,
  );

  const txHash: Hash = await SpokeService.deposit(
    {
      from: suiSpokeProvider.getWalletAddressBytes(),
      token,
      amount,
      data,
    },
    suiSpokeProvider,
    sonicEvmHubProvider,
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
