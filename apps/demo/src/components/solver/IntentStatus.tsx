import React from 'react';
import type { Hex } from '@new-world/sdk';
import { statusCodeToMessage } from '@/lib/utils';
import { useStatus } from '@new-world/dapp-kit';

export default function IntentStatus({
  intent_tx_hash,
}: {
  intent_tx_hash: Hex;
}) {
  const { data: status } = useStatus(intent_tx_hash);

  if (status) {
    if (status.ok) {
      return (
        <div className="flex flexitems-center content-center justify-center text-center pb-4">
          <span>Intent tx hash: {intent_tx_hash}</span>
          <span>Status: {statusCodeToMessage(status.value.status)}</span>
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
