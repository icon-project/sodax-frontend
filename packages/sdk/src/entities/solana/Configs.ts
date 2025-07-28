import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import type { AssetManager } from './types/asset_manager.js';
import type { Connection as ConnectionContract } from './types/connection.js';
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
