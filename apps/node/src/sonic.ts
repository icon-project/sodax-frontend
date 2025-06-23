import { type Address, type Hex, encodeFunctionData } from 'viem';
import {
  EvmHubProvider,
  SonicSpokeProvider,
  getHubChainConfig,
  SONIC_MAINNET_CHAIN_ID,
  type HubChainId,
  getMoneyMarketConfig,
  type EvmHubProviderConfig,
  type SodaxConfig,
  Sodax,
  spokeChainConfig,
  SonicSpokeService,
  type SpokeChainId,
  erc20Abi,
} from '@sodax/sdk';
import { EvmWalletProvider } from './wallet-providers/EvmWalletProvider';

// load PK from .env
const privateKey = process.env.PRIVATE_KEY;
const HUB_CHAIN_ID: HubChainId = SONIC_MAINNET_CHAIN_ID;
const HUB_RPC_URL = 'https://rpc.soniclabs.com';

if (!privateKey) {
  throw new Error('PRIVATE_KEY environment variable is required');
}

const hubEvmWallet = new EvmWalletProvider(privateKey as Hex, HUB_CHAIN_ID, HUB_RPC_URL);
const spokeEvmWallet = new EvmWalletProvider(privateKey as Hex, HUB_CHAIN_ID, HUB_RPC_URL);

const hubConfig = {
  hubRpcUrl: HUB_RPC_URL,
  chainConfig: getHubChainConfig(HUB_CHAIN_ID),
} satisfies EvmHubProviderConfig;

const hubProvider = new EvmHubProvider(hubConfig);
const spokeProvider = new SonicSpokeProvider(spokeEvmWallet, spokeChainConfig[HUB_CHAIN_ID]);

const moneyMarketConfig = getMoneyMarketConfig(HUB_CHAIN_ID);

const sodax = new Sodax({
  moneyMarket: moneyMarketConfig,
  hubProviderConfig: hubConfig,
} satisfies SodaxConfig);
// 0xEEFdd69e94466D935022702Cddd9c4abD66Ce73Fz
async function supply(token: Address, amount: bigint) {
  const wallet = await spokeProvider.walletProvider.getWalletAddress();
  const userRouter = await SonicSpokeService.getUserRouter(wallet, spokeProvider);
  if (token !== '0x0000000000000000000000000000000000000000') {
    const txHash = await spokeProvider.walletProvider.sendTransaction({
      to: token,
      from: wallet,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [userRouter, amount],
      }),
      value: 0n,
    });
    console.log('[approve] txHash', txHash);
    await new Promise(f => setTimeout(f, 1000));
  }
  const data = sodax.moneyMarket.supplyData(token, wallet, amount, spokeProvider.chainConfig.chain.id);

  const txHash = await SonicSpokeService.deposit(
    {
      from: wallet,
      token,
      amount,
      data,
    },
    spokeProvider,
  );

  console.log('[supply] txHash', txHash);
}

async function borrow(token: Address, amount: bigint) {
  const wallet = await spokeProvider.walletProvider.getWalletAddress();
  const borrowInfo = await SonicSpokeService.getBorrowInfo(
    token,
    spokeProvider.chainConfig.chain.id,
    sodax.moneyMarket,
  );
  const approveHash = await SonicSpokeService.approveBorrow(wallet, borrowInfo, amount, spokeProvider);
  console.log('[approve] txHash', approveHash);

  await new Promise(f => setTimeout(f, 1000));
  const data = sodax.moneyMarket.borrowData(wallet, wallet, token, amount, spokeProvider.chainConfig.chain.id);

  const txHash = await SonicSpokeService.callWallet(data, spokeProvider);
  console.log('[borrow] txHash', txHash);
}

async function withdraw(token: Address, amount: bigint) {
  const wallet = await spokeProvider.walletProvider.getWalletAddress();
  const withdrawInfo = await SonicSpokeService.getWithdrawInfo(token, amount, spokeProvider, sodax.moneyMarket);
  const approveHash = await SonicSpokeService.approveWithdraw(wallet, withdrawInfo, spokeProvider);
  console.log('[approve] txHash', approveHash);
  await new Promise(f => setTimeout(f, 1000));

  const withdrawData = await SonicSpokeService.withdrawData(
    wallet,
    withdrawInfo,
    amount,
    spokeProvider,
    sodax.moneyMarket,
  );

  const txHash = await SonicSpokeService.callWallet(withdrawData, spokeProvider);

  console.log('[withdraw] txHash', txHash);
}

async function repay(token: Address, amount: bigint) {
  const wallet = await spokeProvider.walletProvider.getWalletAddress();
  const userRouter = await SonicSpokeService.getUserRouter(wallet, spokeProvider);
  const data = sodax.moneyMarket.repayData(token, wallet, amount, spokeProvider.chainConfig.chain.id);
  if (token !== '0x0000000000000000000000000000000000000000') {
    const txHash = await spokeProvider.walletProvider.sendTransaction({
      to: token,
      from: wallet,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [userRouter, amount],
      }),
      value: 0n,
    });
    console.log('[approve] txHash', txHash);
    await new Promise(f => setTimeout(f, 1000));
  }
  const txHash = await SonicSpokeService.deposit(
    {
      from: wallet,
      token,
      amount,
      data,
    },
    spokeProvider,
  );

  console.log('[repay] txHash', txHash);
}

async function borrowTo(token: Hex, amount: bigint, to: Hex, spokeChainId: SpokeChainId) {
  const wallet = await spokeProvider.walletProvider.getWalletAddress();
  const borrowInfo = await SonicSpokeService.getBorrowInfo(token, spokeChainId, sodax.moneyMarket);
  const approveHash = await SonicSpokeService.approveBorrow(wallet, borrowInfo, amount, spokeProvider);
  console.log('[approve] txHash', approveHash);
  await new Promise(f => setTimeout(f, 1000));
  const data = sodax.moneyMarket.borrowData(wallet, to, token, amount, spokeChainId);

  const txHash = await SonicSpokeService.callWallet(data, spokeProvider);
  console.log('[borrow] txHash', txHash);
}
// Main function to decide which function to call
async function main() {
  const functionName = process.argv[2];

  if (functionName === 'supply') {
    const token = process.argv[3] as Address;
    const amount = BigInt(process.argv[4]);
    await supply(token, amount);
  } else if (functionName === 'borrow') {
    const token = process.argv[3] as Address;
    const amount = BigInt(process.argv[4]);
    await borrow(token, amount);
  } else if (functionName === 'borrowTo') {
    const token = process.argv[3] as Address;
    const amount = BigInt(process.argv[4]);
    const to = process.argv[5] as Hex;
    const spokeChainId = process.argv[6] as SpokeChainId;
    await borrowTo(token, amount, to, spokeChainId);
  } else if (functionName === 'withdraw') {
    const token = process.argv[3] as Address;
    const amount = BigInt(process.argv[4]);
    await withdraw(token, amount);
  } else if (functionName === 'repay') {
    const token = process.argv[3] as Address;
    const amount = BigInt(process.argv[4]);
    await repay(token, amount);
  } else {
    console.log('Function not recognized. Please use "supply", "borrow", "withdraw", or "repay".');
  }
}

main();
