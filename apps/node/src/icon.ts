import type { Address, Hash, Hex } from 'viem';
import {
  EvmAssetManagerService,
  EvmHubProvider,
  type MoneyMarketConfig,
  EvmWalletAbstraction,
  EvmWalletProvider,
  getHubChainConfig,
  MoneyMarketService,
  spokeChainConfig,
  SpokeService,
  type IconSpokeChainConfig,
  IconSpokeProvider,
  IconWalletProvider,
  type IconAddress,
  getIconAddressBytes,
  SONIC_TESTNET_CHAIN_ID,
  getMoneyMarketConfig,
  type HubChainId,
  SONIC_MAINNET_CHAIN_ID,
  ICON_TESTNET_CHAIN_ID,
  ICON_MAINNET_CHAIN_ID,
} from '@new-world/sdk';

// load PK from .env
const privateKey = process.env.PRIVATE_KEY;

if (!privateKey) {
  throw new Error('PRIVATE_KEY environment variable is required');
}

const IS_TESTNET = process.env.IS_TESTNET === 'true';
const HUB_CHAIN_ID: HubChainId = IS_TESTNET ? SONIC_TESTNET_CHAIN_ID : SONIC_MAINNET_CHAIN_ID;
const HUB_RPC_URL = IS_TESTNET ? 'https://rpc.blaze.soniclabs.com' : 'https://rpc.soniclabs.com';

const sonicEvmWallet = new EvmWalletProvider({
  chain: HUB_CHAIN_ID,
  privateKey: privateKey as Hex,
  provider: HUB_RPC_URL,
});

const DEFAULT_SPOKE_RPC_URL = IS_TESTNET
  ? 'https://lisbon.net.solidwallet.io/api/v3'
  : 'https://ctz.solidwallet.io/api/v3';
const DEFAULT_SPOKE_CHAIN_ID = IS_TESTNET ? ICON_TESTNET_CHAIN_ID : ICON_MAINNET_CHAIN_ID;

const iconSpokeWallet = new IconWalletProvider(privateKey as Hex, DEFAULT_SPOKE_RPC_URL);
const iconSpokeChainConfig = spokeChainConfig[DEFAULT_SPOKE_CHAIN_ID];
const iconSpokeProvider = new IconSpokeProvider(iconSpokeWallet, iconSpokeChainConfig as IconSpokeChainConfig);

const sonicHubChainConfig = getHubChainConfig(HUB_CHAIN_ID);
const sonicEvmHubProvider = new EvmHubProvider(sonicEvmWallet, sonicHubChainConfig);

const moneyMarketConfig: MoneyMarketConfig = getMoneyMarketConfig(HUB_CHAIN_ID);

async function depositTo(token: IconAddress, amount: bigint, recipient: Address) {
  const data = EvmAssetManagerService.depositToData(
    {
      token,
      to: recipient,
      amount,
    },
    iconSpokeChainConfig.chain.id,
  );

  const txHash: Hash = await SpokeService.deposit(
    {
      from: iconSpokeProvider.walletProvider.getWalletAddress() as IconAddress,
      token,
      amount,
      data: data,
    },
    iconSpokeProvider,
    sonicEvmHubProvider,
  );

  console.log('[depositTo] txHash', txHash);
}

async function withdrawAsset(token: IconAddress, amount: bigint, recipient: IconAddress) {
  const data = EvmAssetManagerService.withdrawAssetData(
    {
      token,
      to: getIconAddressBytes(recipient),
      amount,
    },
    sonicEvmHubProvider,
    iconSpokeChainConfig.chain.id,
  );
  const txHash: Hash = await SpokeService.callWallet(
    iconSpokeProvider.walletProvider.getWalletAddress() as IconAddress,
    data,
    iconSpokeProvider,
    sonicEvmHubProvider,
  );

  console.log('[withdrawAsset] txHash', txHash);
}

async function supply(token: IconAddress, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    iconSpokeProvider.chainConfig.chain.id,
    iconSpokeProvider.walletProvider.getWalletAddressBytes(),
    sonicEvmHubProvider,
  );

  const data = MoneyMarketService.supplyData(
    token,
    hubWallet,
    amount,
    iconSpokeChainConfig.chain.id,
    moneyMarketConfig,
  );

  const txHash = await SpokeService.deposit(
    {
      from: iconSpokeProvider.walletProvider.getWalletAddress() as IconAddress,
      token,
      amount,
      data,
    },
    iconSpokeProvider,
    sonicEvmHubProvider,
  );

  console.log('[supply] txHash', txHash);
}

async function borrow(token: IconAddress, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    iconSpokeProvider.chainConfig.chain.id,
    iconSpokeProvider.walletProvider.getWalletAddressBytes(),
    sonicEvmHubProvider,
  );
  const data: Hex = MoneyMarketService.borrowData(
    hubWallet,
    iconSpokeProvider.walletProvider.getWalletAddressBytes(),
    token,
    amount,
    iconSpokeChainConfig.chain.id,
    sonicEvmHubProvider,
    moneyMarketConfig,
  );

  const txHash: Hash = await SpokeService.callWallet(
    iconSpokeProvider.walletProvider.getWalletAddress() as IconAddress,
    data,
    iconSpokeProvider,
    sonicEvmHubProvider,
  );

  console.log('[borrow] txHash', txHash);
}

async function withdraw(token: IconAddress, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    iconSpokeProvider.chainConfig.chain.id,
    iconSpokeProvider.walletProvider.getWalletAddressBytes(),
    sonicEvmHubProvider,
  );

  const data: Hex = MoneyMarketService.withdrawData(
    hubWallet,
    iconSpokeProvider.walletProvider.getWalletAddressBytes(),
    token,
    amount,
    iconSpokeChainConfig.chain.id,
    sonicEvmHubProvider,
    moneyMarketConfig,
  );

  const txHash: Hash = await SpokeService.callWallet(
    iconSpokeProvider.walletProvider.getWalletAddress() as IconAddress,
    data,
    iconSpokeProvider,
    sonicEvmHubProvider,
  );

  console.log('[withdraw] txHash', txHash);
}

async function repay(token: IconAddress, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    iconSpokeProvider.chainConfig.chain.id,
    iconSpokeProvider.walletProvider.getWalletAddressBytes(),
    sonicEvmHubProvider,
  );
  const data: Hex = MoneyMarketService.repayData(
    token,
    hubWallet,
    amount,
    iconSpokeChainConfig.chain.id,
    moneyMarketConfig,
  );

  const txHash: Hash = await SpokeService.deposit(
    {
      from: iconSpokeProvider.walletProvider.getWalletAddress() as IconAddress,
      token,
      amount,
      data,
    },
    iconSpokeProvider,
    sonicEvmHubProvider,
  );

  console.log('[repay] txHash', txHash);
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
  } else {
    console.log('Function not recognized. Please use "deposit" or "anotherFunction".');
  }
}

main();
