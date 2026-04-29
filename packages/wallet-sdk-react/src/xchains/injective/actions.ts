import { useXWalletStore } from '@/useXWalletStore.js';
import { InjectiveXService } from './InjectiveXService.js';
import { isEvmBrowserWallet, Wallet } from '@injectivelabs/wallet-base';
import { getInjectiveAddress } from '@injectivelabs/sdk-ts';

function isWallet(value: string): value is Wallet {
  return Object.values(Wallet).some(v => v === value);
}

export const reconnectInjective = async () => {
  const injectiveConnection = useXWalletStore.getState().xConnections.INJECTIVE;
  if (!injectiveConnection) return;

  const recentXConnectorId = injectiveConnection.xConnectorId;
  if (!isWallet(recentXConnectorId)) {
    console.warn(`[Injective] Stale wallet ID skipped: ${recentXConnectorId}`);
    return;
  }

  const walletStrategy = InjectiveXService.getInstance().walletStrategy;
  await walletStrategy.setWallet(recentXConnectorId);
  const addresses = await walletStrategy.getAddresses();

  const firstAddress = addresses?.[0];
  if (!firstAddress) return;

  const address = isEvmBrowserWallet(recentXConnectorId) ? getInjectiveAddress(firstAddress) : firstAddress;

  useXWalletStore.getState().setXConnection('INJECTIVE', {
    xAccount: {
      address,
      xChainType: 'INJECTIVE',
    },
    xConnectorId: recentXConnectorId,
  });
};
