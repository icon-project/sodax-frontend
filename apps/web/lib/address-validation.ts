import { isAddress as isEvmAddress } from 'viem';
import { PublicKey } from '@solana/web3.js';
import { isValidSuiAddress } from '@mysten/sui/utils';
import { StrKey } from '@stellar/stellar-sdk';
import { bech32 } from 'bech32';

function isValidInjectiveAddress(addr: string): boolean {
  try {
    return bech32.decode(addr).prefix === 'inj';
  } catch {
    return false;
  }
}

function isValidIconAddress(addr: string): boolean {
  return /^h[ cx]/.test(addr);
}

export function validateChainAddress(address: string | null | undefined, chain: string): boolean {
  if (!address) return false;

  try {
    switch (chain) {
      case 'EVM':
        return isEvmAddress(address);
      case 'SOLANA':
        new PublicKey(address);
        return true;
      case 'SUI':
        return isValidSuiAddress(address);
      case 'STELLAR':
        return StrKey.isValidEd25519PublicKey(address);
      case 'INJECTIVE':
        return isValidInjectiveAddress(address);
      case 'ICON':
        return isValidIconAddress(address);
      default:
        return false;
    }
  } catch {
    return false;
  }
}
