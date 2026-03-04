import { PublicKey, type TransactionInstruction } from '@solana/web3.js';
import type { Hex } from 'viem';
import { SOLANA_MAINNET_CHAIN_ID, spokeChainConfig, type SolanaRawTransactionInstruction } from '@sodax/types';

export function getSolanaAddressBytes(address: PublicKey): Hex {
  return `0x${Buffer.from(address.toBytes()).toString('hex')}` as Hex;
}

export function hexToSolanaAddress(hex: Hex): PublicKey {
  const hexWithoutPrefix = hex.startsWith('0x') ? hex.slice(2) : hex;
  return new PublicKey(Buffer.from(hexWithoutPrefix, 'hex'));
}

export function isSolanaNativeToken(address: PublicKey): boolean {
  if (address.equals(new PublicKey(spokeChainConfig[SOLANA_MAINNET_CHAIN_ID].nativeToken))) {
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
