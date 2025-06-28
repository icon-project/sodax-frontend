import * as anchor from '@coral-xyz/anchor';
import { Connection, type Keypair, PublicKey } from '@solana/web3.js';
import type { AssetManager } from './types/asset_manager.js';
import type { Connection as ConnectionContract } from './types/connection.js';
export async function getProvider(keypair: Keypair, rpcUrl: string, wsUrl: string): Promise<anchor.AnchorProvider> {
  const wallet = {
    publicKey: keypair.publicKey,
    signTransaction: () => Promise.reject(),
    signAllTransactions: () => Promise.reject(),
  };
  const connection = new Connection(rpcUrl, {
    wsEndpoint: wsUrl,
  });
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
    console.log('Failed to fetch Program IDl:', err);
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
    keypair: Keypair,
    rpcUrl: string,
    wsUrl: string,
    assetManager: string,
): Promise<anchor.Program<AssetManager>> {
  const provider = await getProvider(keypair, rpcUrl, wsUrl);
  const idl = await getAssetManagerIdl(assetManager, provider);

  return new anchor.Program(idl as anchor.Idl, provider) as unknown as anchor.Program<AssetManager>;
}

export async function getConnectionProgram(
    keypair: Keypair,
    rpcUrl: string,
    wsUrl: string,
    connection: string,
): Promise<anchor.Program<ConnectionContract>> {
  const provider = await getProvider(keypair, rpcUrl, wsUrl);
  const idl = await getConnectionIdl(connection, provider);

  return new anchor.Program(idl as anchor.Idl, provider) as unknown as anchor.Program<ConnectionContract>;
}
