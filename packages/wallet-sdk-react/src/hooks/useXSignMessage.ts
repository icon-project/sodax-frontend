import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import type { ChainType } from '@sodax/types';
import { StellarXService } from '@/xchains/stellar';
import { InjectiveXService } from '@/xchains/injective';
import { useXAccount } from './useXAccount';
import { getEthereumAddress } from '@injectivelabs/sdk-ts';
import { Wallet } from '@injectivelabs/wallet-base';
import { useChainActionsRegistry } from '../context/ChainActionsContext';

type SignMessageReturnType = `0x${string}` | Uint8Array | string | undefined;

export function useXSignMessage(): UseMutationResult<
  SignMessageReturnType,
  Error,
  { xChainType: ChainType; message: string },
  unknown
> {
  const { address: injectiveAddress } = useXAccount('INJECTIVE');
  const actionsRegistry = useChainActionsRegistry();

  return useMutation({
    mutationFn: async ({ xChainType, message }: { xChainType: ChainType; message: string }) => {
      let signature: SignMessageReturnType;

      // Try ChainActions first (EVM, SUI, SOLANA)
      const chainActions = actionsRegistry[xChainType];
      if (chainActions?.signMessage) {
        return await chainActions.signMessage(message);
      }

      // Fallback for non-provider chains
      switch (xChainType) {
        case 'STELLAR': {
          const res = await StellarXService.getInstance().walletsKit.signMessage(message);
          signature = res.signedMessage;
          break;
        }

        case 'INJECTIVE': {
          if (!injectiveAddress) {
            throw new Error('Injective address not found');
          }

          const ethereumAddress = getEthereumAddress(injectiveAddress);
          const walletStrategy = InjectiveXService.getInstance().walletStrategy;
          const res = await walletStrategy.signArbitrary(
            walletStrategy.getWallet() === Wallet.Metamask ? ethereumAddress : injectiveAddress,
            message,
          );

          if (!res) {
            throw new Error('Injective signature not found');
          }
          signature = res;
          break;
        }

        default:
          console.warn('Unsupported chain type');
          break;
      }

      return signature;
    },
  });
}
