import { useXWalletStore } from '@/useXWalletStore.js';
import { StellarXService } from './StellarXService.js';

export const reconnectStellar = async () => {
  const stellarConnection = useXWalletStore.getState().xConnections.STELLAR;
  if (!stellarConnection) return;

  const recentXConnectorId = stellarConnection.xConnectorId;
  const stellarWalletKit = StellarXService.getInstance().walletsKit;
  stellarWalletKit.setWallet(recentXConnectorId);
  const { address } = await stellarWalletKit.getAddress();
  useXWalletStore.getState().setXConnection('STELLAR', {
    xAccount: {
      address,
      xChainType: 'STELLAR',
    },
    xConnectorId: recentXConnectorId,
  });
};
