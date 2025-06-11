import { PublicKey } from '@solana/web3.js';
import type { Hex } from 'viem';
import { spokeChainConfig } from '../../../constants.js';
import { type SolanaChainConfig, SOLANA_MAINNET_CHAIN_ID } from '@sodax/types';

const solanaSpokeChainConfig = spokeChainConfig[SOLANA_MAINNET_CHAIN_ID] as SolanaChainConfig;

export function getSolanaAddressBytes(address: PublicKey): Hex {
  return `0x${Buffer.from(address.toBytes()).toString('hex')}` as Hex;
}

export function hexToSolanaAddress(hex: Hex): PublicKey {
  const hexWithoutPrefix = hex.startsWith('0x') ? hex.slice(2) : hex;
  return new PublicKey(Buffer.from(hexWithoutPrefix, 'hex'));
}

export function isNative(address: PublicKey): Boolean {
  if (address.equals(new PublicKey(solanaSpokeChainConfig.nativeToken))) {
    return true;
  }
  return false;
}
