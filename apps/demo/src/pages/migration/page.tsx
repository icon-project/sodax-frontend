import React from 'react';

import { useWalletProvider, useXAccount } from '@sodax/wallet-sdk-react';
import { useAppStore } from '@/zustand/useAppStore';
import { useDeriveUserWalletAddress, useSpokeProvider } from '@sodax/dapp-kit';

export default function MigrationPage() {
  const { openWalletModal, selectedChainId, selectChainId } = useAppStore();
  const xAccount = useXAccount(selectedChainId);

  const walletProvider = useWalletProvider(selectedChainId);
  const spokeProvider = useSpokeProvider(selectedChainId, walletProvider);
  const { data: walletAddressOnHub } = useDeriveUserWalletAddress(spokeProvider, xAccount?.address);

  return (
    <main className="">
      <div className="container mx-auto p-4 mt-10 space-y-4">hej</div>
    </main>
  );
}
