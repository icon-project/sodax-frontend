import { ETHEREUM_MAINNET_CHAIN_ID } from '@sodax/types';

export const SLOW_CHAINS = [ETHEREUM_MAINNET_CHAIN_ID];

/**
 * Determines swap timing information based on source and destination chains.
 * Ethereum swaps take longer (~3 mins) due to block times, while other chains are faster (~30s).
 *
 * @param inputChainId - The source chain ID
 * @param outputChainId - The destination chain ID
 * @returns Object containing timing labels, CSS classes, and slow chain status
 */
export const getSwapTiming = (inputChainId: string, outputChainId: string) => {
  const isSlowChain = SLOW_CHAINS.includes(inputChainId) || SLOW_CHAINS.includes(outputChainId);

  return {
    isSlowChain,
    label: isSlowChain ? 'Takes longer (~3 mins)' : 'Takes ~30s',
    shortLabel: isSlowChain ? '~3 mins' : '~30s',
    textClass: isSlowChain ? 'text-cherry-bright' : 'text-clay-light',
    iconClass: `w-4 h-4 ${isSlowChain ? 'text-cherry-bright' : 'text-clay-light'}`,
  };
};
