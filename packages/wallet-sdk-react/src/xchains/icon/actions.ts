import { useXWalletStore } from '@/useXWalletStore.js';
import { ICONexRequestEventType, ICONexResponseEventType, request } from './iconex/index.js';

export const reconnectIcon = async () => {
  const iconConnection = useXWalletStore.getState().xConnections.ICON;
  if (!iconConnection) return;

  const recentXConnectorId = iconConnection.xConnectorId;

  const detail = await request({
    type: ICONexRequestEventType.REQUEST_ADDRESS,
  });

  if (detail?.type === ICONexResponseEventType.RESPONSE_ADDRESS) {
    useXWalletStore.getState().setXConnection('ICON', {
      xAccount: {
        address: detail?.payload,
        xChainType: 'ICON',
      },
      xConnectorId: recentXConnectorId,
    });
  }
};
