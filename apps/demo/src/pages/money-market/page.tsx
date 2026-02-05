import React from 'react';

import { ChainSelector } from '@/components/shared/ChainSelector';
import { SupplyAssetsList } from '@/components/mm/lists/SupplyAssetsList';
import { Button } from '@/components/ui/button';
import { useXAccount } from '@sodax/wallet-sdk-react';
import { useAppStore } from '@/zustand/useAppStore';
import { useGetUserHubWalletAddress } from '@sodax/dapp-kit';
import { Wallet } from 'lucide-react';
import { BorrowAssetsList } from '@/components/mm/lists/borrow/BorrowAssetsList';

export default function MoneyMarketPage() {
  const { openWalletModal, selectedChainId, selectChainId } = useAppStore();
  const xAccount = useXAccount(selectedChainId);

  const { data: walletAddressOnHub } = useGetUserHubWalletAddress(selectedChainId, xAccount?.address);

  return (
    <main className="min-h-screen bg-linear-to-br from-almost-white via-cream-white to-vibrant-white">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        {/* Header Section */}
        <div className="my-3">
          <h1 className="text-4xl font-bold text-cherry-dark">Money Market</h1>
          <p className="text-clay">Supply and borrow assets across multiple chains</p>
        </div>{' '}
        {/* Controls Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-cherry-grey/20 p-3 my-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-clay">Chain:</span>
              <ChainSelector selectedChainId={selectedChainId} selectChainId={selectChainId} />
            </div>

            {walletAddressOnHub && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-clay">Hub Wallet Address:</span>
                <span className="px-3 py-1.5 bg-cream rounded-lg text-cherry-dark font-mono text-xs">
                  {walletAddressOnHub}
                </span>
              </div>
            )}
          </div>
        </div>
        {/* Main Content */}
        {xAccount?.address ? (
          <div className="animate-in fade-in duration-500">
            <SupplyAssetsList />
            <BorrowAssetsList />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[500px] bg-white rounded-xl shadow-sm border border-cherry-grey/20 p-12">
            <div className="max-w-md text-center space-y-6">
              <div className="w-15 h-15 bg-cherry-brighter rounded-full flex items-center justify-center mx-auto">
                <Wallet className="w-8 h-8 text-cherry-dark" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-cherry-dark mb-2">Connect Your Wallet</h2>
                <p className="text-clay">Connect your wallet to start supplying and borrowing assets</p>
              </div>
              <Button onClick={openWalletModal} variant="cherry" size="lg" className="px-8">
                Connect Wallet
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
