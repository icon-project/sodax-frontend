import { useXWalletStore } from '@/useXWalletStore';
import { InjectiveXService } from './InjectiveXService';
import { isEvmBrowserWallet } from '@injectivelabs/wallet-base';
import { getInjectiveAddress } from '@injectivelabs/sdk-ts';
import type { Wallet } from '@injectivelabs/wallet-base';

export const reconnectInjective = async () => {
  const injectiveConnection = useXWalletStore.getState().xConnections.INJECTIVE;
  if (!injectiveConnection) return;

  const recentXConnectorId = injectiveConnection.xConnectorId;
  const walletStrategy = InjectiveXService.getInstance().walletStrategy;
  await walletStrategy.setWallet(recentXConnectorId as Wallet);
  const addresses = await walletStrategy.getAddresses();

  const address = isEvmBrowserWallet(recentXConnectorId as Wallet)
    ? getInjectiveAddress(addresses?.[0])
    : addresses?.[0];

  useXWalletStore.getState().setXConnection('INJECTIVE', {
    xAccount: {
      address,
      xChainType: 'INJECTIVE',
    },
    xConnectorId: recentXConnectorId,
  });
};
