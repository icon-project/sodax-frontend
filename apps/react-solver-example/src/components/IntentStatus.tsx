import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Hex, IntentErrorResponse, IntentStatusResponse, Result } from '@new-world/sdk';
import { statusCodeToMessage } from '@/lib/utils';
import { sodax } from '@/constants';

export default function IntentStatus({
  intent_tx_hash,
}: {
  intent_tx_hash: Hex;
}) {
  const [status, setStatus] = useState<Result<IntentStatusResponse, IntentErrorResponse> | undefined>(undefined);

  useQuery({
    queryKey: [intent_tx_hash],
    queryFn: async () => {
      const intentResult = await sodax.solver.getStatus({ intent_tx_hash });
      setStatus(intentResult);

      return intentResult;
    },
    refetchInterval: 3000, // 3s
  });

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
