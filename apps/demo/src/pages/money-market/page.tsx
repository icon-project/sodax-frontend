import React from 'react';

import { SupplyAssetsList } from '@/components/mm/lists/SupplyAssetsList';
import { Button } from '@/components/ui/button';
import { useXAccount } from '@sodax/wallet-sdk';
import { useAppStore } from '@/zustand/useAppStore';
import { supportedSpokeChains } from '@sodax/sdk';
import { SelectChain } from '@/components/solver/SelectChain';

export default function MoneyMarketPage() {
  const { openWalletModal, selectedChainId, selectChainId } = useAppStore();
  const xAccount = useXAccount(selectedChainId);

  return (
    <main className="">
      <div className="container mx-auto p-4 mt-10 space-y-4">
        <SelectChain chainList={supportedSpokeChains} value={selectedChainId} setChain={selectChainId} />
        {xAccount?.address ? (
          <SupplyAssetsList />
        ) : (
          <div className="flex justify-center items-center h-[600px] border-2">
            <Button onClick={openWalletModal}>Connect</Button>
          </div>
        )}
      </div>
    </main>
  );
}
