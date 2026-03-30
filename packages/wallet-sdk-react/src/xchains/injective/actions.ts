import { useXWagmiStore } from '@/useXWagmiStore';
import { InjectiveXService } from './InjectiveXService';
import { isEvmBrowserWallet } from '@injectivelabs/wallet-base';
import { getInjectiveAddress } from '@injectivelabs/sdk-ts';
import type { Wallet } from '@injectivelabs/wallet-base';

export const reconnectInjective = async () => {
  const injectiveConnection = useXWagmiStore.getState().xConnections.INJECTIVE;
  if (!injectiveConnection) return;

  const recentXConnectorId = injectiveConnection.xConnectorId;
  const walletStrategy = InjectiveXService.getInstance().walletStrategy;
  await walletStrategy.setWallet(recentXConnectorId as Wallet);
  const addresses = await walletStrategy.getAddresses();

  const address = isEvmBrowserWallet(recentXConnectorId as Wallet)
    ? getInjectiveAddress(addresses?.[0])
    : addresses?.[0];

  useXWagmiStore.setState({
    xConnections: {
      ...useXWagmiStore.getState().xConnections,
      INJECTIVE: {
        xAccount: {
          address,
          xChainType: 'INJECTIVE',
        },
        xConnectorId: recentXConnectorId,
      },
    },
  });
};
