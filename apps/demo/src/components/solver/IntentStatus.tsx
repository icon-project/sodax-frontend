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
        <div className="flex flex-col text-center pb-4">
          <div>Intent tx hash: {intent_tx_hash}</div>
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
