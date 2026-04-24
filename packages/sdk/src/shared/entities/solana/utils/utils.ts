import { PublicKey, type TransactionInstruction, Connection } from '@solana/web3.js';
import type { Hex } from 'viem';
import { ChainKeys, spokeChainConfig, type SolanaRawTransactionInstruction } from '@sodax/types';
import * as anchor from '@coral-xyz/anchor';
import type { AssetManager } from '../types/asset_manager.js';
import type { Connection as ConnectionContract } from '../types/connection.js';
export async function getProvider(base58PublicKey: string, rpcUrl: string): Promise<anchor.AnchorProvider> {
  const wallet = {
    publicKey: new PublicKey(base58PublicKey),
    signTransaction: () => Promise.reject(),
    signAllTransactions: () => Promise.reject(),
  };
  const connection = new Connection(rpcUrl);
  return new anchor.AnchorProvider(connection, wallet, { commitment: 'confirmed' });
}

export async function getAssetManagerIdl(assetManager: string, provider: anchor.AnchorProvider) {
  try {
    const idl = await anchor.Program.fetchIdl(new PublicKey(assetManager), provider);

    if (!idl) {
      throw new Error('asset manager idl not available');
    }

    return idl;
  } catch (err) {
    console.error('Failed to fetch Program IDl:', err);
    throw err;
  }
}

export async function getConnectionIdl(connection: string, provider: anchor.AnchorProvider) {
  try {
    const idl = await anchor.Program.fetchIdl(new PublicKey(connection), provider);

    if (!idl) {
      throw new Error('asset manager idl not available');
    }

    return idl;
  } catch (err) {
    console.log('Failed to fetch Program IDl:', err);
    throw err;
  }
}

export async function getAssetManagerProgram(
  base58PublicKey: string,
  rpcUrl: string,
  assetManager: string,
): Promise<anchor.Program<AssetManager>> {
  const provider = await getProvider(base58PublicKey, rpcUrl);
  const idl = await getAssetManagerIdl(assetManager, provider);

  return new anchor.Program(idl, provider) as unknown as anchor.Program<AssetManager>;
}

export async function getConnectionProgram(
  base58PublicKey: string,
  rpcUrl: string,
  connection: string,
): Promise<anchor.Program<ConnectionContract>> {
  const provider = await getProvider(base58PublicKey, rpcUrl);
  const idl = await getConnectionIdl(connection, provider);

  return new anchor.Program(idl, provider) as unknown as anchor.Program<ConnectionContract>;
}

export function getSolanaAddressBytes(address: PublicKey): Hex {
  return `0x${Buffer.from(address.toBytes()).toString('hex')}` as Hex;
}

export function hexToSolanaAddress(hex: Hex): PublicKey {
  const hexWithoutPrefix = hex.startsWith('0x') ? hex.slice(2) : hex;
  return new PublicKey(Buffer.from(hexWithoutPrefix, 'hex'));
}

export function isSolanaNativeToken(address: PublicKey): boolean {
  if (address.equals(new PublicKey(spokeChainConfig[ChainKeys.SOLANA_MAINNET].nativeToken))) {
    return true;
  }
  return false;
}

export function convertTransactionInstructionToRaw(
  instruction: TransactionInstruction,
): SolanaRawTransactionInstruction {
  return {
    keys: instruction.keys.map(key => ({
      pubkey: key.pubkey.toBase58(),
      isSigner: key.isSigner,
      isWritable: key.isWritable,
    })),
    programId: instruction.programId.toBase58(),
    data: instruction.data,
  };
}
