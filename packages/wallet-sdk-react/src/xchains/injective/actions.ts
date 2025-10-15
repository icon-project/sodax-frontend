import { useXWagmiStore } from '@/useXWagmiStore';
import { InjectiveXService } from './InjectiveXService';
import type { Wallet } from '@injectivelabs/wallet-base';

export const reconnectInjective = async () => {
  const injectiveConnection = useXWagmiStore.getState().xConnections.INJECTIVE;
  if (!injectiveConnection) return;

  const recentXConnectorId = injectiveConnection.xConnectorId;
  const walletStrategy = InjectiveXService.getInstance().walletStrategy;
  walletStrategy.setWallet(recentXConnectorId as Wallet);
  const addresses = await walletStrategy.getAddresses();
  useXWagmiStore.setState({
    xConnections: {
      ...useXWagmiStore.getState().xConnections,
      INJECTIVE: {
        xAccount: {
          address: addresses?.[0],
          xChainType: 'INJECTIVE',
        },
        xConnectorId: recentXConnectorId,
      },
    },
  });
};
