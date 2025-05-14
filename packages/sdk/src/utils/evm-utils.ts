import { encodeAbiParameters, parseAbiParameters, type Hex, type TransactionReceipt } from 'viem';
import type { EvmContractCall } from '../types.js';
import type { EvmWalletProvider } from '../entities/index.js';
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

export async function waitForTransactionReceipt(hash: Hex, provider: EvmWalletProvider): Promise<TransactionReceipt> {
  return provider.publicClient.waitForTransactionReceipt({ hash });
}
