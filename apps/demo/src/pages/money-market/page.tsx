import React, { useState } from 'react';

import { ChainSelector } from '@/components/shared/ChainSelector';
import { SupplyAssetsList } from '@/components/mm/lists/SupplyAssetsList';
import { Button } from '@/components/ui/button';
import { getXChainType, useWalletProvider, useXAccount, useXSignMessage } from '@sodax/wallet-sdk-react';
import { useAppStore } from '@/zustand/useAppStore';
import { useDeriveUserWalletAddress, useSpokeProvider } from '@sodax/dapp-kit';
import type { ChainType } from '@sodax/types';

export default function MoneyMarketPage() {
  const { openWalletModal, selectedChainId, selectChainId } = useAppStore();
  const xAccount = useXAccount(selectedChainId);

  const walletProvider = useWalletProvider(selectedChainId);
  const spokeProvider = useSpokeProvider(selectedChainId, walletProvider);
  const { data: walletAddressOnHub } = useDeriveUserWalletAddress(spokeProvider, xAccount?.address);
  const { mutateAsync: signMessage, isPending } = useXSignMessage();

  const [signature, setSignature] = useState<unknown | undefined>(undefined);
  const handleSignMessage = async () => {
    const signature = await signMessage({
      xChainType: getXChainType(selectedChainId) as ChainType,
      message: 'Hello, world!',
    });
    console.log('signature', signature);
    setSignature(signature);
  };

  return (
    <main className="">
      <div className="container mx-auto p-4 mt-10 space-y-4">
        <div className="flex items-center gap-2">
          <ChainSelector selectedChainId={selectedChainId} selectChainId={selectChainId} />
          <div className="text-sm">hub wallet address: {walletAddressOnHub}</div>
        </div>
        {xAccount?.address ? (
          <>
            <Button onClick={handleSignMessage}>Sign Message</Button>
            <div className="text-sm">signature: {signature?.toString()}</div>
            <SupplyAssetsList />
          </>
        ) : (
          <div className="flex justify-center items-center h-[600px] border-2">
            <Button onClick={openWalletModal}>Connect</Button>
          </div>
        )}
      </div>
    </main>
  );
}
