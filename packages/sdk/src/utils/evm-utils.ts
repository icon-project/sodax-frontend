import { encodeAbiParameters, parseAbiParameters } from 'viem';
import type { EvmContractCall } from '../types.js';
import type { IEvmWalletProvider, EvmRawTransactionReceipt, Hex } from '@sodax/types';

/**
 * ABI-encode an array of ContractCall objects.
 * @param calls An array of ContractCall objects.
 * @returns ABI-encoded bytes representing the array of ContractCall objects.
 */
export function encodeContractCalls(calls: EvmContractCall[]): Hex {
  return encodeAbiParameters(parseAbiParameters('(address,uint256,bytes)[]'), [
    calls.map(v => [v.address, v.value, v.data] as const),
  ]);
}

export async function waitForTransactionReceipt(
  hash: Hex,
  provider: IEvmWalletProvider,
): Promise<EvmRawTransactionReceipt> {
  return provider.waitForTransactionReceipt(hash);
}
