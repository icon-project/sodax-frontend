import { useXWagmiStore } from '@/useXWagmiStore';
import { StellarXService } from './StellarXService';

export const reconnectStellar = async () => {
  const stellarConnection = useXWagmiStore.getState().xConnections.STELLAR;
  if (!stellarConnection) return;

  const recentXConnectorId = stellarConnection.xConnectorId;
  const stellarWalletKit = StellarXService.getInstance().walletsKit;
  stellarWalletKit.setWallet(recentXConnectorId);
  const { address } = await stellarWalletKit.getAddress();
  useXWagmiStore.setState({
    xConnections: {
      ...useXWagmiStore.getState().xConnections,
      STELLAR: {
        xAccount: {
          address,
          xChainType: 'STELLAR',
        },
        xConnectorId: recentXConnectorId,
      },
    },
  });
};
