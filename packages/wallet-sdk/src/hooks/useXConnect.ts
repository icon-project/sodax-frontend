import type { XAccount } from '@/types';
import { useConnectWallet } from '@mysten/dapp-kit';
import { useWallet } from '@solana/wallet-adapter-react';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { useConnect } from 'wagmi';
import type { XConnector } from '../core/XConnector';
import { useXWagmiStore } from '../useXWagmiStore';
import type { EvmXConnector } from '../xchains/evm';
import type { SolanaXConnector } from '../xchains/solana';
import type { SuiXConnector } from '../xchains/sui';

/**
 * Hook for connecting to various blockchain wallets across different chains
 *
 * Handles connection logic for EVM, SUI, Solana and other supported chains.
 * Sets up wallet connections and stores connection state in XWagmiStore.
 *
 * @param {void} - No parameters required
 * @returns {UseMutationResult<XAccount | undefined, Error, XConnector>} Mutation result containing:
 * - mutateAsync: Function to connect a wallet
 * - isPending: Boolean indicating if connection is in progress
 * - error: Any error that occurred
 * - data: Connected account data if successful
 *
 * @example
 * ```ts
 * const { mutateAsync: connect, isPending } = useXConnect();
 *
 * const handleConnect = async (connector: XConnector) => {
 *   try {
 *     await connect(connector);
 *   } catch (err) {
 *     console.error(err);
 *   }
 * };
 * ```
 */
export function useXConnect(): UseMutationResult<XAccount | undefined, Error, XConnector> {
  const setXConnection = useXWagmiStore(state => state.setXConnection);

  const { connectAsync: evmConnectAsync } = useConnect();
  const { mutateAsync: suiConnectAsync } = useConnectWallet();
  // const solanaWallet = useWallet();
  const { select, connect, connected } = useWallet();

  return useMutation({
    mutationFn: async (xConnector: XConnector) => {
      const xChainType = xConnector.xChainType;
      let xAccount: XAccount | undefined;

      switch (xChainType) {
        case 'EVM':
          await evmConnectAsync({ connector: (xConnector as EvmXConnector).connector });
          break;
        case 'SUI':
          await suiConnectAsync({ wallet: (xConnector as SuiXConnector).wallet });
          break;
        case 'SOLANA':
          await select((xConnector as SolanaXConnector).wallet.adapter.name);

          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Wallet connection timeout')), 15000);

            connect()
              .then(() => {
                if (connected) {
                  clearTimeout(timeout);
                  resolve();
                } else {
                  const interval = setInterval(() => {
                    if (connected) {
                      clearTimeout(timeout);
                      clearInterval(interval);
                      resolve();
                    }
                  }, 100);
                }
              })
              .catch(err => {
                clearTimeout(timeout);
                reject(err);
              });
          });

          break;
        default:
          xAccount = await xConnector.connect();
          break;
      }

      if (xAccount) {
        setXConnection(xConnector.xChainType, {
          xAccount,
          xConnectorId: xConnector.id,
        });
      }

      return xAccount;
    },
  });
}
