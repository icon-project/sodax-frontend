import React from 'react';
import type { Hex, Intent } from '@sodax/sdk';
import { useStatus } from '@sodax/dapp-kit';
import { statusCodeToMessage } from '@/lib/utils';

export default function OrderStatus({
  order,
}: {
  order: { intentHash: Hex; intent: Intent; intentTxHash: Hex };
}) {
  const { data: status } = useStatus(order.intentTxHash);

  if (status) {
    if (status.ok) {
      return (
        <div className="flex flex-col text-center pb-4">
          <div>Order ID: {order.intent.intentId.toString()}</div>
          <div>Intent Hash: {order.intentHash}</div>
          <div>Intent Tx Hash: {order.intentTxHash}</div>
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
