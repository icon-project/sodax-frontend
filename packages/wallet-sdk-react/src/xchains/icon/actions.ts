import { useXWagmiStore } from '@/useXWagmiStore';
import { ICONexRequestEventType, ICONexResponseEventType, request } from './iconex';

export const reconnectIcon = async () => {
  const iconConnection = useXWagmiStore.getState().xConnections.ICON;
  if (!iconConnection) return;

  const recentXConnectorId = iconConnection.xConnectorId;

  const detail = await request({
    type: ICONexRequestEventType.REQUEST_ADDRESS,
  });

  if (detail?.type === ICONexResponseEventType.RESPONSE_ADDRESS) {
    useXWagmiStore.setState({
      xConnections: {
        ...useXWagmiStore.getState().xConnections,
        ICON: {
          xAccount: {
            address: detail?.payload,
            xChainType: 'ICON',
          },
          xConnectorId: recentXConnectorId,
        },
      },
    });
  }
};
