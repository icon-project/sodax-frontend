import type { XAccount } from '@/types';
import { useConnectWallet } from '@mysten/dapp-kit';
import { useWallet } from '@solana/wallet-adapter-react';
import { useMutation } from '@tanstack/react-query';
import { useConnect } from 'wagmi';
import type { XConnector } from '../core/XConnector';
import { useXWagmiStore } from '../useXWagmiStore';
import type { EvmXConnector } from '../xchains/evm';
import type { SolanaXConnector } from '../xchains/solana';
import type { SuiXConnector } from '../xchains/sui';

export function useXConnect() {
  const setXConnection = useXWagmiStore(state => state.setXConnection);

  const { connectAsync: evmConnectAsync } = useConnect();
  const { mutateAsync: suiConnectAsync } = useConnectWallet();
  const solanaWallet = useWallet();

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
          {
            const walletName = (xConnector as SolanaXConnector).wallet.adapter.name;
            await solanaWallet.select(walletName);
            await solanaWallet.connect();
          }
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
