import 'dotenv/config';
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function (): string {
  return this.toString();
};

import {
  Sodax,
  type Hex,
  spokeChainConfig,
  ARBITRUM_MAINNET_CHAIN_ID,
  SONIC_MAINNET_CHAIN_ID,
  SOLANA_MAINNET_CHAIN_ID,
  EvmSpokeProvider,
  type EvmSpokeChainConfig,
  AVALANCHE_MAINNET_CHAIN_ID,
  type Address,
  SonicSpokeProvider,
  SUI_MAINNET_CHAIN_ID,
  SuiSpokeProvider,
  SolanaSpokeProvider,
  BASE_MAINNET_CHAIN_ID,
} from '@sodax/sdk';
import { EvmWalletProvider, SolanaWalletProvider, SuiWalletProvider } from '@sodax/wallet-sdk-core';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { parseUnits } from 'viem';
import { borrow, repay, supply, withdraw } from '../moneymarket-actions.js';

const evmPrivateKey = process.env.EVM_PRIVATE_KEY as Hex;
const solanaPrivateKey = process.env.SOLANA_PRIVATE_KEY;
const iconPrivateKey = process.env.ICON_PRIVATE_KEY;
const stellarPrivateKey = process.env.STELLAR_PRIVATE_KEY;
const suiWalletMnemonics = process.env.SUI_MNEMONICS;

if (!solanaPrivateKey || !evmPrivateKey || !iconPrivateKey || !stellarPrivateKey || !suiWalletMnemonics) {
  throw new Error('private keys environment variables are required');
}

const sodax = new Sodax();

const arbWalletProvider = new EvmWalletProvider({
  privateKey: evmPrivateKey as Hex,
  chainId: ARBITRUM_MAINNET_CHAIN_ID,
});

const sonicWalletProvider = new EvmWalletProvider({
  privateKey: evmPrivateKey as Hex,
  chainId: SONIC_MAINNET_CHAIN_ID,
});

const suiWalletProvider = new SuiWalletProvider({
  rpcUrl: 'https://fullnode.testnet.sui.io',
  mnemonics: suiWalletMnemonics,
});

// Initialize Solana keypair from base58-encoded private key
const keypair = Keypair.fromSecretKey(new Uint8Array(bs58.decode(solanaPrivateKey)));
const solanaWallet = new SolanaWalletProvider({
  privateKey: keypair.secretKey,
  endpoint: spokeChainConfig[SOLANA_MAINNET_CHAIN_ID].rpcUrl,
});

/**
 * Runs an EVM to EVM test where the source and destination chain IDs
 * are EVM chain IDs, with the exception that SONIC_MAINNET_CHAIN_ID is omitted.
 * This ensures that 'sonic' is not used as a valid chain for this function.
 */
async function evmToEvmTest(): Promise<void> {
  const src = ARBITRUM_MAINNET_CHAIN_ID;
  const dst = AVALANCHE_MAINNET_CHAIN_ID;

  console.log(`Running EVM to EVM test from ${src} to ${dst}`);
  const srcSpokeProvider = new EvmSpokeProvider(
    new EvmWalletProvider({
      privateKey: evmPrivateKey as Hex,
      chainId: src,
    }),
    spokeChainConfig[src],
  );
  const dstSpokeProvider = new EvmSpokeProvider(
    new EvmWalletProvider({
      privateKey: evmPrivateKey as Hex,
      chainId: dst,
    }),
    spokeChainConfig[dst] as EvmSpokeChainConfig,
  );

  const SUPPLY_AMOUNT = '0.0001';
  const BORROW_AMOUNT = '0.00001';
  const SRC_TOKEN = spokeChainConfig[src].supportedTokens.USDC;
  const DST_TOKEN = spokeChainConfig[dst].supportedTokens.USDC;

  const [srcWalletAddress, dstWalletAddress]: [string, string] = await Promise.all([
    srcSpokeProvider.walletProvider.getWalletAddress(),
    dstSpokeProvider.walletProvider.getWalletAddress(),
  ]);

  // supply SRC_TOKEN to the money market pool on the source chain
  await supply(
    {
      token: SRC_TOKEN.address, // NOTE: token address must match the token address of the source chain token you are sending from
      amount: parseUnits(SUPPLY_AMOUNT, SRC_TOKEN.decimals),
      action: 'supply',
      toChainId: dst, // leaving toChainId and toAddress empty will default to provided spoke provider's wallet address and chain id
      toAddress: dstWalletAddress as Address,
    },
    srcSpokeProvider,
  );

  await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10 seconds for the supply to be confirmed

  // borrow SRC_TOKEN to the destination chain and wallet
  await borrow(
    {
      token: SRC_TOKEN.address, // NOTE: token address must match the token address of the toChainId token you are receiving
      amount: parseUnits(BORROW_AMOUNT, SRC_TOKEN.decimals),
      action: 'borrow',
      toChainId: src, // leaving toChainId and toAddress empty will default to provided spoke provider's wallet address and chain id
      toAddress: srcWalletAddress as Address,
    },
    dstSpokeProvider,
  );

  await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10 seconds for the supply to be confirmed

  // repay the borrowed SRC_TOKEN on destination chain back to the source chain and wallet
  await repay(
    {
      token: SRC_TOKEN.address, // NOTE: token address must match the token address of the source chain token you are sending from to repay
      amount: parseUnits(BORROW_AMOUNT, SRC_TOKEN.decimals),
      action: 'repay',
      toChainId: dst, // leaving toChainId and toAddress empty will default to provided spoke provider's wallet address and chain id
      toAddress: dstWalletAddress as Address,
    },
    srcSpokeProvider,
  );

  await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10 seconds for the supply to be confirmed

  // withdraw the supplied SRC_TOKEN from source to destination chain and wallet
  await withdraw(
    {
      token: SRC_TOKEN.address, // NOTE: token address must match the token address of the toChainId chain token you are withdrawing to
      amount: parseUnits(SUPPLY_AMOUNT, SRC_TOKEN.decimals),
      action: 'withdraw',
      toChainId: src, // leaving toChainId and toAddress empty will default to provided spoke provider's wallet address and chain id
      toAddress: srcWalletAddress as Address,
    },
    dstSpokeProvider,
  );

  await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10 seconds for the withdraw to be confirmed

  console.log(`EVM to EVM test from ${src} to ${dst} completed successfully`);
}

async function evmToHubTest() {
  const src = ARBITRUM_MAINNET_CHAIN_ID;
  const dst = SONIC_MAINNET_CHAIN_ID;

  console.log(`Running EVM to Hub (Sonic) test from ${src} to ${dst}`);
  const srcSpokeProvider = new EvmSpokeProvider(
    new EvmWalletProvider({
      privateKey: evmPrivateKey as Hex,
      chainId: src,
    }),
    spokeChainConfig[src],
  );
  const dstSpokeProvider = new SonicSpokeProvider(
    new EvmWalletProvider({
      privateKey: evmPrivateKey as Hex,
      chainId: dst,
    }),
    spokeChainConfig[dst],
  );

  const SUPPLY_AMOUNT = '0.0001';
  const BORROW_AMOUNT = '0.00001';
  const SRC_TOKEN = spokeChainConfig[src].supportedTokens.bnUSD;
  const DST_TOKEN = spokeChainConfig[dst].supportedTokens.bnUSD;

  const [srcWalletAddress, dstWalletAddress]: [string, string] = await Promise.all([
    srcSpokeProvider.walletProvider.getWalletAddress(),
    dstSpokeProvider.walletProvider.getWalletAddress(),
  ]);

  // supply SRC_TOKEN from Arbitrum to the Sonic chain and wallet address
  await supply(
    {
      token: SRC_TOKEN.address, // NOTE: token address must match the token address of the source chain token you are sending from
      amount: parseUnits(SUPPLY_AMOUNT, SRC_TOKEN.decimals),
      action: 'supply',
      toChainId: dst, // leaving toChainId and toAddress empty will default to provided spoke provider's wallet address and chain id
      toAddress: dstWalletAddress as Address,
    },
    srcSpokeProvider,
  );
  await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10 seconds for the supply to be confirmed

  // borrow SRC_TOKEN from Sonic to the Arbitrum chain and wallet address
  await borrow(
    {
      token: SRC_TOKEN.address, // NOTE: token address must match the token address of the toChainId token you are receiving
      amount: parseUnits(BORROW_AMOUNT, SRC_TOKEN.decimals),
      action: 'borrow',
      toChainId: src, // leaving toChainId and toAddress empty will default to provided spoke provider's wallet address and chain id
      toAddress: srcWalletAddress as Address,
    },
    dstSpokeProvider,
  ); //NOTE: debt is applied to the Sonic chain and wallet address

  await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10 seconds for the borrow to be confirmed

  // repay the borrowed SRC_TOKEN on Arbitrum chain back to the Sonic chain and wallet address
  await repay(
    {
      token: SRC_TOKEN.address, // NOTE: token address must match the token address of the source chain token you are sending from to repay
      amount: parseUnits(BORROW_AMOUNT, SRC_TOKEN.decimals),
      action: 'repay',
      toChainId: dst, // leaving toChainId and toAddress empty will default to provided spoke provider's wallet address and chain id
      toAddress: dstWalletAddress as Address,
    },
    srcSpokeProvider,
  );

  await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10 seconds for the repay to be confirmed

  // withdraw the supplied SRC_TOKEN from Sonic chain back to Arbitrum chain and wallet address
  await withdraw(
    {
      token: SRC_TOKEN.address, // NOTE: token address must match the token address of the toChainId chain token you are withdrawing to
      amount: parseUnits(SUPPLY_AMOUNT, SRC_TOKEN.decimals),
      action: 'withdraw',
      toChainId: src, // leaving toChainId and toAddress empty will default to provided spoke provider's wallet address and chain id
      toAddress: srcWalletAddress as Address,
    },
    dstSpokeProvider,
  );

  await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10 seconds for the withdraw to be confirmed

  console.log(`EVM to EVM test from ${src} to ${dst} completed successfully`);
}

async function hubToEvmTest() {
  const src = SONIC_MAINNET_CHAIN_ID;
  const dst = ARBITRUM_MAINNET_CHAIN_ID;
  console.log(`Running Hub to EVM test from ${src} to ${dst}`);
  const srcSpokeProvider = new SonicSpokeProvider(
    new EvmWalletProvider({
      privateKey: evmPrivateKey as Hex,
      chainId: src,
    }),
    spokeChainConfig[src],
  );
  const dstSpokeProvider = new EvmSpokeProvider(
    new EvmWalletProvider({
      privateKey: evmPrivateKey as Hex,
      chainId: dst,
    }),
    spokeChainConfig[dst],
  );

  const SUPPLY_AMOUNT = '0.001';
  const BORROW_AMOUNT = '0.00001';
  const SRC_TOKEN = spokeChainConfig[src].supportedTokens.bnUSD;
  const DST_TOKEN = spokeChainConfig[dst].supportedTokens.bnUSD;

  const [srcWalletAddress, dstWalletAddress]: [string, string] = await Promise.all([
    srcSpokeProvider.walletProvider.getWalletAddress(),
    dstSpokeProvider.walletProvider.getWalletAddress(),
  ]);

  // supply USDC to the money market pool on the source chain
  await supply(
    {
      token: SRC_TOKEN.address, // NOTE: token address must match the token address of the source chain token you are sending from
      amount: parseUnits(SUPPLY_AMOUNT, SRC_TOKEN.decimals),
      action: 'supply',
      toChainId: dst, // leaving toChainId and toAddress empty will default to provided spoke provider's wallet address and chain id
      toAddress: dstWalletAddress as Address,
    },
    srcSpokeProvider,
  );

  await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10 seconds for the supply to be confirmed

  // borrow SRC_TOKEN to the destination chain and wallet
  await borrow(
    {
      token: SRC_TOKEN.address, // NOTE: token address must match the token address of the toChainId token you are receiving
      amount: parseUnits(BORROW_AMOUNT, SRC_TOKEN.decimals),
      action: 'borrow',
      toChainId: src, // leaving toChainId and toAddress empty will default to provided spoke provider's wallet address and chain id
      toAddress: srcWalletAddress as Address,
    },
    dstSpokeProvider,
  );

  await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10 seconds for the borrow to be confirmed

  // repay the borrowed SRC_TOKEN on destination chain back to the source chain and wallet
  await repay(
    {
      token: SRC_TOKEN.address, // NOTE: token address must match the token address of the source chain token you are sending from to repay
      amount: parseUnits(BORROW_AMOUNT, SRC_TOKEN.decimals),
      action: 'repay',
      toChainId: dst, // leaving toChainId and toAddress empty will default to provided spoke provider's wallet address and chain id
      toAddress: dstWalletAddress as Address,
    },
    srcSpokeProvider,
  );

  await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10 seconds for the repay to be confirmed

  // withdraw the supplied SRC_TOKEN from source to destination chain and wallet
  await withdraw(
    {
      token: SRC_TOKEN.address, // NOTE: token address must match the token address of the toChainId chain token you are withdrawing to
      amount: parseUnits(SUPPLY_AMOUNT, SRC_TOKEN.decimals),
      action: 'withdraw',
      toChainId: src, // leaving toChainId and toAddress empty will default to provided spoke provider's wallet address and chain id
      toAddress: srcWalletAddress as Address,
    },
    dstSpokeProvider,
  );

  await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10 seconds for the withdraw to be confirmed

  console.log(`EVM to Hub test from ${src} to ${dst} completed successfully`);
}

async function hubTest() {
  const src = SONIC_MAINNET_CHAIN_ID;
  console.log(`Running Hub test for ${src}`);
  const srcSpokeProvider = new SonicSpokeProvider(
    new EvmWalletProvider({
      privateKey: evmPrivateKey as Hex,
      chainId: src,
    }),
    spokeChainConfig[src],
  );

  const SUPPLY_AMOUNT = '0.0001';
  const BORROW_AMOUNT = '0.00001';
  const SRC_TOKEN = spokeChainConfig[src].supportedTokens.USDC;

  // supply SRC_TOKEN to the money market pool on the source chain
  await supply(
    {
      token: SRC_TOKEN.address,
      amount: parseUnits(SUPPLY_AMOUNT, SRC_TOKEN.decimals),
      action: 'supply',
    },
    srcSpokeProvider,
  );

  await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10 seconds for the supply to be confirmed

  // borrow USDC to the destination chain and wallet
  await borrow(
    {
      token: SRC_TOKEN.address,
      amount: parseUnits(BORROW_AMOUNT, SRC_TOKEN.decimals),
      action: 'borrow',
    },
    srcSpokeProvider,
  );

  await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10 seconds for the borrow to be confirmed

  // repay the borrowed USDC on destination chain back to the source chain and wallet
  await repay(
    {
      token: SRC_TOKEN.address,
      amount: parseUnits(BORROW_AMOUNT, SRC_TOKEN.decimals),
      action: 'repay',
    },
    srcSpokeProvider,
  );

  await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10 seconds for the repay to be confirmed

  // withdraw the supplied USDC from source to destination chain and wallet
  await withdraw(
    {
      token: SRC_TOKEN.address,
      amount: parseUnits(SUPPLY_AMOUNT, SRC_TOKEN.decimals),
      action: 'withdraw',
    },
    srcSpokeProvider,
  );

  await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10 seconds for the withdraw to be confirmed

  console.log(`Hub test for ${src} completed successfully`);
}

/**
 * Runs an SUI to Solana test where the source and destination chain IDs
 * are SUI and Solana chain IDs.
 */
async function suiToSolanaTest(): Promise<void> {
  const src = SUI_MAINNET_CHAIN_ID;
  const dst = SOLANA_MAINNET_CHAIN_ID;

  if (!suiWalletMnemonics) {
    throw new Error('SUI_MNEMONICS environment variable is required');
  }

  if (!solanaPrivateKey) {
    throw new Error('SOLANA_PRIVATE_KEY environment variable is required');
  }

  console.log(`Running SUI to Solana test from ${src} to ${dst}`);
  const srcSpokeProvider = new SuiSpokeProvider(
    spokeChainConfig[src],
    new SuiWalletProvider({
      rpcUrl: 'https://fullnode.mainnet.sui.io',
      mnemonics: suiWalletMnemonics,
    }),
  );
  const dstSpokeProvider = new SolanaSpokeProvider(
    new SolanaWalletProvider({
      privateKey: Keypair.fromSecretKey(new Uint8Array(bs58.decode(solanaPrivateKey))).secretKey,
      endpoint: process.env.SOLANA_RPC_URL || spokeChainConfig[SOLANA_MAINNET_CHAIN_ID].rpcUrl,
    }),
    spokeChainConfig[dst],
  );

  const SUPPLY_AMOUNT = '0.0001';
  const BORROW_AMOUNT = '0.00002';
  const SRC_TOKEN = spokeChainConfig[src].supportedTokens.bnUSD;
  const DST_TOKEN = spokeChainConfig[dst].supportedTokens.bnUSD;

  const [srcWalletAddress, dstWalletAddress]: [string, string] = await Promise.all([
    srcSpokeProvider.walletProvider.getWalletAddress(),
    dstSpokeProvider.walletProvider.getWalletAddress(),
  ]);

  // supply SRC_TOKEN to the money market pool on the source chain
  await supply(
    {
      token: SRC_TOKEN.address, // NOTE: token address must match the token address of the source chain token you are sending from
      amount: parseUnits(SUPPLY_AMOUNT, SRC_TOKEN.decimals),
      action: 'supply',
      toChainId: dst, // leaving toChainId and toAddress empty will default to provided spoke provider's wallet address and chain id
      toAddress: dstWalletAddress as Address,
    },
    srcSpokeProvider,
  );

  await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10 seconds for the supply to be confirmed

  // borrow SRC_TOKEN to the destination chain and wallet
  await borrow(
    {
      token: SRC_TOKEN.address, // NOTE: token address must match the token address of the toChainId token you are receiving
      amount: parseUnits(BORROW_AMOUNT, SRC_TOKEN.decimals),
      action: 'borrow',
      toChainId: src, // leaving toChainId and toAddress empty will default to provided spoke provider's wallet address and chain id
      toAddress: srcWalletAddress as Address,
    },
    dstSpokeProvider,
  );

  await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10 seconds for the supply to be confirmed

  // repay the borrowed SRC_TOKEN on destination chain back to the source chain and wallet
  await repay(
    {
      token: SRC_TOKEN.address, // NOTE: token address must match the token address of the source chain token you are sending from to repay
      amount: parseUnits(BORROW_AMOUNT, SRC_TOKEN.decimals),
      action: 'repay',
      toChainId: dst, // leaving toChainId and toAddress empty will default to provided spoke provider's wallet address and chain id
      toAddress: dstWalletAddress as Address,
    },
    srcSpokeProvider,
  );

  await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10 seconds for the supply to be confirmed

  // withdraw the supplied SRC_TOKEN from source to destination chain and wallet
  await withdraw(
    {
      token: SRC_TOKEN.address, // NOTE: token address must match the token address of the toChainId chain token you are withdrawing to
      amount: parseUnits(SUPPLY_AMOUNT, SRC_TOKEN.decimals),
      action: 'withdraw',
      toChainId: src, // leaving toChainId and toAddress empty will default to provided spoke provider's wallet address and chain id
      toAddress: srcWalletAddress as Address,
    },
    dstSpokeProvider,
  );

  await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10 seconds for the withdraw to be confirmed

  console.log(`EVM to EVM test from ${src} to ${dst} completed successfully`);
}

/**
 * Runs an Solana to Evm test where the source and destination chain IDs
 * are Solana and Evm chain IDs.
 */
async function SolanaToEvmTest(): Promise<void> {
  const src = SOLANA_MAINNET_CHAIN_ID;
  const dst = BASE_MAINNET_CHAIN_ID;

  if (!solanaPrivateKey) {
    throw new Error('SOLANA_PRIVATE_KEY environment variable is required');
  }

  console.log(`Running SUI to Solana test from ${src} to ${dst}`);
  const srcSpokeProvider = new SolanaSpokeProvider(
    new SolanaWalletProvider({
      privateKey: Keypair.fromSecretKey(new Uint8Array(bs58.decode(solanaPrivateKey))).secretKey,
      endpoint: process.env.SOLANA_RPC_URL || spokeChainConfig[SOLANA_MAINNET_CHAIN_ID].rpcUrl,
    }),
    spokeChainConfig[src],
  );

  const dstSpokeProvider = new EvmSpokeProvider(
    new EvmWalletProvider({
      privateKey: evmPrivateKey,
      chainId: dst,
    }),
    spokeChainConfig[dst],
  );

  const SUPPLY_AMOUNT = '0.0001';
  const BORROW_AMOUNT = '0.00002';
  const SRC_TOKEN = spokeChainConfig[src].supportedTokens.bnUSD;
  const DST_TOKEN = spokeChainConfig[dst].supportedTokens.bnUSD;

  const [srcWalletAddress, dstWalletAddress]: [string, string] = await Promise.all([
    srcSpokeProvider.walletProvider.getWalletAddress(),
    dstSpokeProvider.walletProvider.getWalletAddress(),
  ]);

  // supply SRC_TOKEN to the money market pool on the source chain
  await supply(
    {
      token: SRC_TOKEN.address, // NOTE: token address must match the token address of the source chain token you are sending from
      amount: parseUnits(SUPPLY_AMOUNT, SRC_TOKEN.decimals),
      action: 'supply',
      toChainId: dst, // leaving toChainId and toAddress empty will default to provided spoke provider's wallet address and chain id
      toAddress: dstWalletAddress as Address,
    },
    srcSpokeProvider,
  );

  await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10 seconds for the supply to be confirmed

  // borrow SRC_TOKEN to the destination chain and wallet
  await borrow(
    {
      token: SRC_TOKEN.address, // NOTE: token address must match the token address of the toChainId token you are receiving
      amount: parseUnits(BORROW_AMOUNT, SRC_TOKEN.decimals),
      action: 'borrow',
      toChainId: src, // leaving toChainId and toAddress empty will default to provided spoke provider's wallet address and chain id
      toAddress: srcWalletAddress as Address,
    },
    dstSpokeProvider,
  );

  await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10 seconds for the supply to be confirmed

  // repay the borrowed SRC_TOKEN on destination chain back to the source chain and wallet
  await repay(
    {
      token: SRC_TOKEN.address, // NOTE: token address must match the token address of the source chain token you are sending from to repay
      amount: parseUnits(BORROW_AMOUNT, SRC_TOKEN.decimals),
      action: 'repay',
      toChainId: dst, // leaving toChainId and toAddress empty will default to provided spoke provider's wallet address and chain id
      toAddress: dstWalletAddress as Address,
    },
    srcSpokeProvider,
  );

  await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10 seconds for the supply to be confirmed

  // withdraw the supplied SRC_TOKEN from source to destination chain and wallet
  await withdraw(
    {
      token: SRC_TOKEN.address, // NOTE: token address must match the token address of the toChainId chain token you are withdrawing to
      amount: parseUnits(SUPPLY_AMOUNT, SRC_TOKEN.decimals),
      action: 'withdraw',
      toChainId: src, // leaving toChainId and toAddress empty will default to provided spoke provider's wallet address and chain id
      toAddress: srcWalletAddress as Address,
    },
    dstSpokeProvider,
  );

  await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10 seconds for the withdraw to be confirmed

  console.log(`EVM to EVM test from ${src} to ${dst} completed successfully`);
}

async function main() {
  // await evmToEvmTest();
  // await evmToHubTest();
  // await hubToEvmTest();
  // await hubTest();
  // await suiToSolanaTest();
  await SolanaToEvmTest();
}

main().catch(console.error);
