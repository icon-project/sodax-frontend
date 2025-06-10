import React from 'react';
import type { Hex, Intent, PacketData } from '@sodax/sdk';
import { useStatus } from '@sodax/dapp-kit';
import { statusCodeToMessage } from '@/lib/utils';

export default function OrderStatus({
  order,
}: {
  order: { intentHash: Hex; intent: Intent; packet: PacketData };
}) {
  const { data: status } = useStatus(order.packet.dst_tx_hash as Hex);

  if (status) {
    if (status.ok) {
      return (
        <div className="flex flex-col text-center pb-4">
          <div>Order ID: {order.intent.intentId}</div>
          <div>Intent Hash: {order.intentHash}</div>
          <div>Intent Tx Hash: {order.packet.dst_tx_hash as Hex}</div>
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
