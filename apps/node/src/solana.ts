import {
  EvmAssetManagerService,
  EvmHubProvider,
  EvmWalletAbstraction,
  type SolanaChainConfig,
  SolanaSpokeProvider,
  SolanaWalletProvider,
  SpokeService,
  getHubChainConfig,
  spokeChainConfig,
  type EvmHubProviderConfig,
  getMoneyMarketConfig,
  Sodax,
  type SodaxConfig,
  SOLANA_MAINNET_CHAIN_ID,
  type SolverConfigParams,
  SONIC_MAINNET_CHAIN_ID,
} from '@new-world/sdk';
import { Keypair, PublicKey } from '@solana/web3.js';
import * as dotenv from 'dotenv';
import { keccak256 } from 'ethers';
import type { Address, Hash, Hex } from 'viem';
import { EvmWalletProvider } from './wallet-providers';
dotenv.config();

const privateKey = process.env.PRIVATE_KEY;
const IS_TESTNET = process.env.IS_TESTNET === 'true';
const HUB_RPC_URL = IS_TESTNET ? 'https://rpc.blaze.soniclabs.com' : 'https://rpc.soniclabs.com';
const HUB_CHAIN_ID = SONIC_MAINNET_CHAIN_ID;
const SOLANA_CHAIN_ID = SOLANA_MAINNET_CHAIN_ID;

const solanaSpokeChainConfig: SolanaChainConfig = spokeChainConfig[SOLANA_CHAIN_ID] as SolanaChainConfig;

if (!privateKey) {
  throw new Error('PRIVATE_KEY environment variable is required');
}
const solanaPrivateKey = process.env.SOLANA_PRIVATE_KEY;
if (!solanaPrivateKey) {
  throw new Error('PRIVATE_KEY environment variable is required');
}

const solPrivateKeyUint8 = new Uint8Array(Buffer.from(solanaPrivateKey, 'hex'));
const keypair = Keypair.fromSecretKey(solPrivateKeyUint8);
const solanaWallet = new SolanaWalletProvider({ privateKey: keypair.secretKey }, solanaSpokeChainConfig.rpcUrl);

const sonicTestnetEvmWallet = new EvmWalletProvider(privateKey as Hex, HUB_CHAIN_ID, HUB_RPC_URL);

const solverConfig = {
  intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef',
  solverApiEndpoint: 'https://staging-new-world.iconblockchain.xyz',
  partnerFee: undefined,
} satisfies SolverConfigParams;

const solanaSpokeProvider = new SolanaSpokeProvider(solanaWallet, solanaSpokeChainConfig);

const hubConfig = {
  hubRpcUrl: HUB_RPC_URL,
  chainConfig: getHubChainConfig(HUB_CHAIN_ID),
} satisfies EvmHubProviderConfig;

const hubProvider = new EvmHubProvider({
  hubRpcUrl: HUB_RPC_URL,
  chainConfig: hubConfig.chainConfig,
});

const moneyMarketConfig = getMoneyMarketConfig(HUB_CHAIN_ID);

const sodax = new Sodax({
  solver: solverConfig,
  moneyMarket: moneyMarketConfig,
  hubProviderConfig: hubConfig,
} satisfies SodaxConfig);

const relayerBackendUrl = IS_TESTNET
  ? 'https://53naa6u2qd.execute-api.us-east-1.amazonaws.com/test'
  : 'https://n7gem91bcb.execute-api.us-east-1.amazonaws.com/prod';

async function submitData(tx_hash: Hash, address: Address, payload: Hex | null) {
  let data = {};
  if (payload == null) {
    data = {
      action: 'submit',
      params: {
        chain_id: solanaSpokeChainConfig.chain.id,
        tx_hash: tx_hash,
      },
    };
  } else {
    data = {
      action: 'submit',
      params: {
        chain_id: solanaSpokeChainConfig.chain.id,
        tx_hash: tx_hash,
        data: {
          address: address,
          payload: payload,
        },
      },
    };
  }

  try {
    const request = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };
    console.log('HTTP Request:', {
      relayerBackendUrl,
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    const response = await fetch(relayerBackendUrl, request);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Response:', result);
    return result;
  } catch (error) {
    console.error('Error submitting data:', error);
    return null;
  }
}

async function depositTo(token: PublicKey, amount: bigint, recipient: Address) {
  const data = EvmAssetManagerService.depositToData(
    {
      token: token.toString(),
      to: recipient,
      amount,
    },
    solanaSpokeChainConfig.chain.id,
  );

  const txHash: Hash = await SpokeService.deposit(
    {
      from: solanaSpokeProvider.walletProvider.getAddress(),
      token: token,
      amount,
      data: keccak256(data) as Hex,
    },
    solanaSpokeProvider,
    hubProvider,
  );

  await sleep(10);
  const userWallet = await getUserWallet();
  const res = await submitData(txHash, userWallet, data as Hex);
  console.log(res);

  console.log('[depositTo] txHash', txHash);
}

async function getDepositAmount(token: PublicKey) {
  const amount = await SpokeService.getDeposit(getSolanaAddressBytes(token), solanaSpokeProvider);
  console.log(amount);
}

function getSolanaAddressBytes(address: PublicKey): Hex {
  return `0x${Buffer.from(address.toBytes()).toString('hex')}`;
}

async function withdrawAsset(token: PublicKey, amount: bigint, recipient: Address) {
  const data = EvmAssetManagerService.withdrawAssetData(
    {
      token: token.toString(),
      to: recipient,
      amount,
    },
    hubProvider,
    solanaSpokeChainConfig.chain.id,
  );

  const txHash: Hash = await SpokeService.callWallet(
    solanaSpokeProvider.walletProvider.getWalletAddressBytes(),
    data,
    solanaSpokeProvider,
    hubProvider,
  );

  await sleep(3);
  const userWallet = await getUserWallet();
  const res = await submitData(txHash, userWallet, null);
  console.log(res);

  console.log('[withdrawAsset] txHash', txHash);
}

async function supply(token: PublicKey, amount: bigint) {
  const hubWallet = await getUserWallet();

  const data = sodax.moneyMarket.supplyData(token.toString(), hubWallet, amount, solanaSpokeChainConfig.chain.id);

  const txHash = await SpokeService.deposit(
    {
      from: solanaSpokeProvider.walletProvider.getAddress(),
      token: token,
      amount,
      data: keccak256(data) as Hex,
    },
    solanaSpokeProvider,
    hubProvider,
  );

  await sleep(3);
  const res = await submitData(txHash, hubWallet, data);
  console.log(res);
  console.log('[supply] txHash', txHash);
}

async function borrow(token: PublicKey, amount: bigint) {
  const hubWallet = await getUserWallet();

  const data: Hex = sodax.moneyMarket.borrowData(
    hubWallet,
    solanaSpokeProvider.walletProvider.getWalletAddressBytes(),
    token.toString(),
    amount,
    solanaSpokeChainConfig.chain.id,
  );

  const txHash: Hash = await SpokeService.callWallet(
    solanaSpokeProvider.walletProvider.getWalletAddressBytes(),
    keccak256(data) as Hex,
    solanaSpokeProvider,
    hubProvider,
  );

  await sleep(3);
  const res = await submitData(txHash, hubWallet, data);
  console.log(res);

  console.log('[borrow] txHash', txHash);
}

async function withdraw(token: PublicKey, amount: bigint) {
  const hubWallet = await getUserWallet();

  const data: Hex = sodax.moneyMarket.withdrawData(
    hubWallet,
    solanaSpokeProvider.walletProvider.getWalletAddressBytes(),
    token.toString(),
    amount,
    solanaSpokeChainConfig.chain.id,
  );

  const txHash: Hash = await SpokeService.callWallet(
    getSolanaAddressBytes(solanaSpokeProvider.walletProvider.getAddress()),
    keccak256(data) as Hex,
    solanaSpokeProvider,
    hubProvider,
  );

  await sleep(3);
  const res = await submitData(txHash, hubWallet, data);
  console.log(res);

  console.log('[withdraw] txHash', txHash);
}

async function repay(token: PublicKey, amount: bigint) {
  const hubWallet = await getUserWallet();

  const data: Hex = sodax.moneyMarket.repayData(token.toString(), hubWallet, amount, solanaSpokeChainConfig.chain.id);

  const txHash: Hash = await SpokeService.deposit(
    {
      from: solanaSpokeProvider.walletProvider.getAddress(),
      token: token,
      amount,
      data: keccak256(data) as Hex,
    },
    solanaSpokeProvider,
    hubProvider,
  );

  await sleep(3);
  const res = await submitData(txHash, hubWallet, data);
  console.log(res);

  console.log('[repay] txHash', txHash);
}

const sleep = (seconds: number) => {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
};

async function getUserWallet() {
  return await EvmWalletAbstraction.getUserHubWalletAddress(
    solanaSpokeProvider.chainConfig.chain.id,
    solanaSpokeProvider.walletProvider.getWalletAddressBytes(),
    hubProvider,
  );
}

// Main function to decide which function to call
async function main() {
  const functionName = process.argv[2];

  if (functionName === 'deposit') {
    const token = new PublicKey(process.argv[3]);
    const amount = BigInt(process.argv[4]);
    const recipient = process.argv[5] as Address;
    await depositTo(token, amount, recipient);
  } else if (functionName === 'withdrawAsset') {
    const token = new PublicKey(process.argv[3]);
    const amount = BigInt(process.argv[4]);
    const recipient = process.argv[5] as Address;
    await withdrawAsset(token, amount, recipient);
  } else if (functionName === 'supply') {
    const token = new PublicKey(process.argv[3]);
    const amount = BigInt(process.argv[4]);
    await supply(token, amount);
  } else if (functionName === 'borrow') {
    const token = new PublicKey(process.argv[3]);
    const amount = BigInt(process.argv[4]);
    await borrow(token, amount);
  } else if (functionName === 'withdraw') {
    const token = new PublicKey(process.argv[3]);
    const amount = BigInt(process.argv[4]);
    await withdraw(token, amount);
  } else if (functionName === 'repay') {
    const token = new PublicKey(process.argv[3]);
    const amount = BigInt(process.argv[4]);
    await repay(token, amount);
  } else if (functionName === 'getDeposit') {
    const token = new PublicKey(process.argv[3]);
    await getDepositAmount(token);
  } else {
    console.log(
      'Function not recognized. Please use "deposit", "withdrawAsset", "supply", "borrow", "withdraw", or "repay".',
    );
  }
}

main();
