import { loadRadfiSession } from './useRadfiAuth';

type UseTradingWalletReturn = {
  tradingAddress: string | undefined;
};

/**
 * Returns the Radfi trading wallet address from the persisted session.
 * Trading wallet is created automatically during authentication — no API call needed.
 */
export function useTradingWallet(walletAddress: string | undefined): UseTradingWalletReturn {
  if (!walletAddress) return { tradingAddress: undefined };
  const session = loadRadfiSession(walletAddress);
  return { tradingAddress: session?.tradingAddress || undefined };
}
