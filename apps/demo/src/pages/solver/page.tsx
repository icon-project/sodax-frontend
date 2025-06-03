import React, { useState } from 'react';
import SwapCard from '@/components/solver/SwapCard';
import type { Address, Hex } from '@new-world/sdk';
import IntentStatus from '@/components/solver/IntentStatus';
import { useXAccount } from '@new-world/xwagmi';

export default function SolverPage() {
  const evmAccount = useXAccount('EVM');

  const [intentTxHash, setIntentTxHash] = useState<Hex | undefined>(undefined);

  return (
    <div className="flex flex-col items-center content-center justify-center h-screen">
      {intentTxHash && <IntentStatus intent_tx_hash={intentTxHash} />}
      <SwapCard setIntentTxHash={setIntentTxHash} address={evmAccount.address as Address} />
    </div>
  );
}
