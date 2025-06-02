import React, { useEffect, useState } from 'react';
import SwapCard from '@/components/solver/SwapCard';
import type {
  Address,
  Hex,
} from '@new-world/sdk';
import { useAccount, useChainId } from 'wagmi';
import IntentStatus from '@/components/solver/IntentStatus';

export default function SolverPage() {
  const evmAccount = useAccount();
  const chainId = useChainId();

  const [intentTxHash, setIntentTxHash] = useState<Hex | undefined>(undefined);
  const providers = [evmAccount.isConnected && evmAccount.address ? evmAccount : undefined];

  return (
      <div className="flex items-center content-center justify-center h-screen w-screen">
        <div className="flex flex-col flex items-center content-center justify-center">
          {providers.some(v => v === undefined) ? (
            <div className="text-center">
              <h1 className="pb-4">Please connect all wallets (Hana Wallet supported)</h1>
              <div className="flex space-x-2 flex items-center content-center justify-center">
              </div>
            </div>
          ) : (
            <div className="flex flex-col text-center pb-6">
              {evmAccount.isConnected && (
                <div>
                  <div>Connected EVM address: {evmAccount.address}</div>
                  <div>Chain ID: {chainId}</div>
                  <div>Chain Name: {evmAccount.chain?.name}</div>
                </div>
              )}
            </div>
          )}
          {intentTxHash && <IntentStatus intent_tx_hash={intentTxHash} />}
          {providers.filter(v => v !== undefined).length === providers.length && (
            <SwapCard setIntentTxHash={setIntentTxHash} address={evmAccount.address as Address} />
          )}
        </div>
      </div>
  );
}

