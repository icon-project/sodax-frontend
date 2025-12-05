import React from 'react';

import { ChainSelector } from '@/components/shared/ChainSelector';
import { SupplyAssetsList } from '@/components/mm/lists/SupplyAssetsList';
import { Button } from '@/components/ui/button';
import { useXAccount } from '@sodax/wallet-sdk-react';
import { useAppStore } from '@/zustand/useAppStore';
import { useDeriveUserWalletAddress } from '@sodax/dapp-kit';

export default function MoneyMarketPage() {
  const { openWalletModal, selectedChainId, selectChainId } = useAppStore();
  const xAccount = useXAccount(selectedChainId);

  const { data: walletAddressOnHub } = useDeriveUserWalletAddress(selectedChainId, xAccount?.address);

  return (
    <main className="">
      <div className="container mx-auto p-4 mt-10 space-y-4">
        <div className="flex items-center gap-2">
          <ChainSelector selectedChainId={selectedChainId} selectChainId={selectChainId} />
          <div className="text-sm">hub wallet address: {walletAddressOnHub}</div>
        </div>
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
