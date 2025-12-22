import 'dotenv/config';
import { type Address, type Hex, type Hash } from 'viem';
import {
  EvmHubProvider,
  type EvmHubProviderConfig,
  getHubChainConfig,
  Sodax,
} from '@sodax/sdk';

import { EvmWalletProvider } from '@sodax/wallet-sdk-core';
import { SONIC_MAINNET_CHAIN_ID, type HubChainId } from '@sodax/types';

import { EvmMultiWalletService } from '@sodax/sdk';

// ==========================================================
// ENV + CONFIG
// ==========================================================
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) throw new Error('PRIVATE_KEY is required');

const HUB_CHAIN_ID: HubChainId = SONIC_MAINNET_CHAIN_ID;
const HUB_RPC_URL = 'https://rpc.testnet.soniclabs.com';

// Hub wallet provider
const hubEvmWallet = new EvmWalletProvider({
  privateKey: privateKey as Hex,
  chainId: HUB_CHAIN_ID,
  rpcUrl: HUB_RPC_URL as `http${string}`,
});

// Hub config
const hubConfig = {
  hubRpcUrl: HUB_RPC_URL,
  chainConfig: getHubChainConfig(),
} satisfies EvmHubProviderConfig;

const sodax = new Sodax();
// Hub provider
const hubProvider = new EvmHubProvider({
  config: hubConfig,
  configService: sodax.config,
});

// ==========================================================
// Command Implementations
// ==========================================================

export function toHexTag(tag: string | Hex): Hex {
  if (typeof tag !== "string") {
    // Already Hex
    return tag;
  }

  // If the user passed a hex string already
  if (tag.startsWith("0x")) {
    return tag as Hex;
  }

  // Convert plain string → hex
  const encoded = Buffer.from(tag, "utf8").toString("hex");
  return ("0x" + encoded) as Hex;
}


async function createWallet(tag: string | Hex) {

  const txHash = await EvmMultiWalletService.createWallet(toHexTag(tag), hubEvmWallet);
  console.log('txHash:', txHash);
}

async function registerWallet(wallet: Address, tag: string | Hex) {
  const call = await EvmMultiWalletService.registerWallet(wallet, toHexTag(tag), hubEvmWallet);
  console.log('call:', call);
}

async function unregisterWallet(wallet: Address, tag: string | Hex) {
  const call = await EvmMultiWalletService.unregisterWallet(wallet, toHexTag(tag), hubEvmWallet);
  console.log('call:', call);
}

async function updateTag(wallet: Address, oldTag: Hex | string, newTag: Hex | string) {
  const call = await EvmMultiWalletService.updateWalletTag(wallet, toHexTag(oldTag), toHexTag(newTag), hubEvmWallet);
  console.log('call:', call);
}

async function addOwner(wallet: Address, owner: Address) {
  const call = await EvmMultiWalletService.addOwner(wallet, owner, hubEvmWallet);
  console.log('call:', call);
}

async function removeOwner(wallet: Address, owner: Address) {
  const call = await EvmMultiWalletService.removeOwner(wallet, owner, hubEvmWallet);
  console.log('call:', call);
}

// Reads

async function getOwners(wallet: Address) {
  const owners = await EvmMultiWalletService.getOwners(wallet,  hubProvider.publicClient);
  console.log('owners:', owners);
}

async function isOwner(wallet: Address, owner: Address) {
  const state = await EvmMultiWalletService.isOwner(wallet, owner, hubProvider.publicClient);
  console.log('isOwner:', state);
}

async function walletsByTag(user: Address, tag: Hex | string) {
  const wallets = await EvmMultiWalletService.getWalletsOfByTag(user, toHexTag(tag), hubProvider.publicClient);
  console.log(wallets);
}

async function allWalletsByTags(user: Address, tagsCsv: string) {
  const tags: Hex[] = tagsCsv.split(',').map((t) => toHexTag(t)) as Hex[];
  const wallets = await EvmMultiWalletService.getAllWalletsOf(user, tags, hubProvider.publicClient);
  console.log(wallets);
}

async function walletsOf(user: Address) {
  const wallets = await EvmMultiWalletService.getWalletsOf(user, hubProvider.publicClient);
  console.log(wallets);
}

// ==========================================================
// CLI
// ==========================================================

async function main() {
  const fn = process.argv[2];

  try {
    switch (fn) {
      case 'createWallet': {
        const tag = process.argv[3] as Hex;
        await createWallet(tag);
        break;
      }

      case 'registerWallet': {
        const wallet = process.argv[3] as Address;
        const tag = process.argv[4] as Hex;
        await registerWallet(wallet, tag);
        break;
      }

      case 'unregisterWallet': {
        const wallet = process.argv[3] as Address;
        const tag = process.argv[4] as Hex;
        await unregisterWallet(wallet, tag);
        break;
      }

      case 'updateTag': {
        const wallet = process.argv[3] as Address;
        const oldTag = process.argv[4] as Hex;
        const newTag = process.argv[5] as Hex;
        await updateTag(wallet, oldTag, newTag);
        break;
      }

      case 'getWalletsOfByTag': {
        const user = process.argv[3] as Address;
        const tag = process.argv[4] as Hex;
        await walletsByTag(user, tag);
        break;
      }

      case 'getAllWalletsOf': {
        const user = process.argv[3] as Address;
        const tags = process.argv[4];
        await allWalletsByTags(user, tags);
        break;
      }

      case 'getWalletsOf': {
        const user = process.argv[3] as Address;
        await walletsOf(user);
        break;
      }

      case 'addOwner': {
        const wallet = process.argv[3] as Address;
        const owner = process.argv[4] as Address;
        await addOwner(wallet, owner);
        break;
      }

      case 'removeOwner': {
        const wallet = process.argv[3] as Address;
        const owner = process.argv[4] as Address;
        await removeOwner(wallet, owner);
        break;
      }

      case 'getOwners': {
        const wallet = process.argv[3] as Address;
        await getOwners(wallet);
        break;
      }

      case 'isOwner': {
        const wallet = process.argv[3] as Address;
        const owner = process.argv[4] as Address;
        await isOwner(wallet, owner);
        break;
      }

      default:
        console.log(`
Usage:
  createWallet <tag>
  registerWallet <wallet> <tag>
  unregisterWallet <wallet> <tag>
  updateTag <wallet> <oldTag> <newTag>

  getWalletsOfByTag <user> <tag>
  getAllWalletsOf <user> <tag1,tag2,...>
  getWalletsOf <user>

  addOwner <wallet> <owner>
  removeOwner <wallet> <owner>
  getOwners <wallet>
  isOwner <wallet> <owner>
        `);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
