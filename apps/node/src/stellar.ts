import type { Hash, Hex, Address } from 'viem';
import {
  EvmAssetManagerService,
  EvmHubProvider,
  MoneyMarketService,
  EvmWalletAbstraction,
  EvmWalletProvider,
  getHubChainConfig,
  spokeChainConfig,
  SpokeService,
  StellarSpokeProvider,
  type StellarSpokeChainConfig,
  StellarWalletProvider,
  SONIC_TESTNET_CHAIN_ID,
  STELLAR_TESTNET_CHAIN_ID,
  getMoneyMarketConfig,
  SONIC_MAINNET_CHAIN_ID,
  STELLAR_MAINNET_CHAIN_ID,
} from '@new-world/sdk';
import { Address as stellarAddress } from '@stellar/stellar-sdk';
import * as dotenv from 'dotenv';
dotenv.config();

const privateKey = process.env.PRIVATE_KEY;
const IS_TESTNET = process.env.IS_TESTNET === 'true';
const HUB_RPC_URL = IS_TESTNET ? 'https://rpc.blaze.soniclabs.com' : 'https://rpc.soniclabs.com';
const HUB_CHAIN_ID = IS_TESTNET ? SONIC_TESTNET_CHAIN_ID : SONIC_MAINNET_CHAIN_ID;
const STELLAR_CHAIN_ID = IS_TESTNET ? STELLAR_TESTNET_CHAIN_ID : STELLAR_MAINNET_CHAIN_ID;
if (!privateKey) {
  throw new Error('PRIVATE_KEY environment variable is required');
}

const hubWallet = new EvmWalletProvider({
  chain: SONIC_TESTNET_CHAIN_ID,
  privateKey: privateKey as Hex,
  provider: HUB_RPC_URL,
});

const HubChainConfig = getHubChainConfig(HUB_CHAIN_ID);
const sonicEvmHubProvider = new EvmHubProvider(hubWallet, HubChainConfig);

const stellarConfig = spokeChainConfig[STELLAR_CHAIN_ID] as StellarSpokeChainConfig;
const STELLAR_SECRET_KEY = process.env.STELLAR_SECRET_KEY ?? "";
const STELLAR_RPC_URL = process.env.STELLAR_RPC_URL || stellarConfig.rpc_url;
const stellarWalletProvider = new StellarWalletProvider(STELLAR_SECRET_KEY);
const stellarSpokeProvider = new StellarSpokeProvider(
  stellarWalletProvider,
  stellarConfig.addresses.assetManager,
  stellarConfig,
  STELLAR_RPC_URL,
);

const moneyMarketService: MoneyMarketService = new MoneyMarketService(getMoneyMarketConfig(HUB_CHAIN_ID));

async function getBalance(token: string) {
  const balance = await stellarSpokeProvider.getBalance(token);
  console.log(balance);
}

async function depositTo(token: string, amount: bigint, recipient: Address) {
  const data = EvmAssetManagerService.depositToData(
    {
      token,
      to: recipient,
      amount,
    },
    stellarSpokeProvider.chainConfig.chain.id,
  );

  const txHash: Hash = await SpokeService.deposit(
    {
      from: stellarSpokeProvider.walletProvider.getWalletAddressBytes(),
      token,
      amount,
      data,
    },
    stellarSpokeProvider,
    sonicEvmHubProvider,
  );

  console.log('[depositTo] txHash', txHash);
}

async function withdrawAsset(
  token: string,
  amount: bigint,
  recipient: string, // stellar address
) {
  const data = EvmAssetManagerService.withdrawAssetData(
    {
      token,
      to: `0x${stellarAddress.fromString(recipient).toScVal().toXDR('hex')}`,
      amount,
    },
    sonicEvmHubProvider,
    stellarSpokeProvider.chainConfig.chain.id,
  );
  const txHash: Hash = await SpokeService.callWallet(
    stellarSpokeProvider.walletProvider.getWalletAddressBytes(),
    data,
    stellarSpokeProvider,
    sonicEvmHubProvider,
  );

  console.log('[withdrawAsset] txHash', txHash);
}

async function supply(token: string, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    stellarSpokeProvider.chainConfig.chain.id,
    stellarSpokeProvider.walletProvider.getWalletAddressBytes(),
    sonicEvmHubProvider,
  );

  const data = moneyMarketService.supplyData(
    token,
    hubWallet,
    amount,
    stellarSpokeProvider.chainConfig.chain.id,
  );

  const txHash = await SpokeService.deposit(
    {
      from: stellarSpokeProvider.walletProvider.getWalletAddressBytes(),
      token,
      amount,
      data,
    },
    stellarSpokeProvider,
    sonicEvmHubProvider,
  );

  console.log('[supply] txHash', txHash);
}

async function borrow(token: string, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    stellarSpokeProvider.chainConfig.chain.id,
    stellarSpokeProvider.walletProvider.getWalletAddressBytes(),
    sonicEvmHubProvider,
  );
  console.log(hubWallet);
  const data: Hex = moneyMarketService.borrowData(
    hubWallet,
    stellarSpokeProvider.walletProvider.getWalletAddressBytes(),
    token,
    amount,
    stellarSpokeProvider.chainConfig.chain.id,
    sonicEvmHubProvider,
  );

  const txHash: Hash = await SpokeService.callWallet(
    stellarSpokeProvider.walletProvider.getWalletAddressBytes(),
    data,
    stellarSpokeProvider,
    sonicEvmHubProvider,
  );

  console.log('[borrow] txHash', txHash);
}

async function withdraw(token: string, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    stellarSpokeProvider.chainConfig.chain.id,
    stellarSpokeProvider.walletProvider.getWalletAddressBytes(),
    sonicEvmHubProvider,
  );

  console.log('Hub wallet: ', hubWallet);

  const data: Hex = moneyMarketService.withdrawData(
    hubWallet,
    stellarSpokeProvider.walletProvider.getWalletAddressBytes(),
    token,
    amount,
    stellarSpokeProvider.chainConfig.chain.id,
    sonicEvmHubProvider,
  );

  const txHash: Hash = await SpokeService.callWallet(
    stellarSpokeProvider.walletProvider.getWalletAddressBytes(),
    data,
    stellarSpokeProvider,
    sonicEvmHubProvider,
  );

  console.log('[withdraw] txHash', txHash);
}

async function repay(token: string, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    stellarSpokeProvider.chainConfig.chain.id,
    stellarSpokeProvider.walletProvider.getWalletAddressBytes(),
    sonicEvmHubProvider,
  );
  const data: Hex = moneyMarketService.repayData(
    token,
    hubWallet,
    amount,
    stellarSpokeProvider.chainConfig.chain.id,
  );

  const txHash: Hash = await SpokeService.deposit(
    {
      from: stellarSpokeProvider.walletProvider.getWalletAddressBytes(),
      token,
      amount,
      data,
    },
    stellarSpokeProvider,
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
