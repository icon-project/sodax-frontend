import React from 'react';
import { useStatus, type Hex, type Intent, type IntentDeliveryInfo } from '@sodax/dapp-kit';
import { statusCodeToMessage } from '@/lib/utils';

export default function OrderStatus({
  order,
}: {
  order: { intentHash: Hex; intent: Intent; intentDeliveryInfo: IntentDeliveryInfo };
}) {
  const { data: status } = useStatus(order.intentDeliveryInfo.dstTxHash as `0x${string}`);

  if (status) {
    if (status.ok) {
      return (
        <div className="flex flex-col text-center pb-4">
          <div>Order ID: {order.intent.intentId.toString()}</div>
          <div>Intent Hash: {order.intentHash}</div>
          <div>Intent Tx Hash: {order.intentDeliveryInfo.dstTxHash}</div>
          <div>Status: {statusCodeToMessage(status.value.status)}</div>
        </div>
      );
    }

    return (
      <div className="flex">
        <span>Error: {status.error.detail.message}</span>
      </div>
    );
  }

  return null;
}
