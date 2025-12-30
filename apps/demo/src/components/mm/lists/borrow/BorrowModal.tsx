import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2 } from 'lucide-react';

import { useBorrow, useSpokeProvider } from '@sodax/dapp-kit';
import { useWalletProvider, useEvmSwitchChain } from '@sodax/wallet-sdk-react';
import type { ChainId, XToken } from '@sodax/types';

import { ChainSelector } from '@/components/shared/ChainSelector';
import type { MoneyMarketBorrowParams } from '@sodax/sdk';
import { parseUnits } from 'viem';
import { useAppStore } from '@/zustand/useAppStore';

interface BorrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: XToken;
  onSuccess?: (amount: string) => void;
  requiresSwitchChain?: boolean;
}

export function BorrowModal({ isOpen, onClose, token, onSuccess }: BorrowModalProps) {
  const { selectedChainId } = useAppStore();
  const [amount, setAmount] = useState('');
  const [destinationChainId, setDestinationChainId] = useState<ChainId>(token.xChainId);

  const borrowExecutionChain: ChainId = token.xChainId;

  // All hooks must run every render (even if data isn’t ready)
  const fromChainWalletProvider = useWalletProvider(selectedChainId);
  const toChainWalletProvider = useWalletProvider(token.xChainId);
  const fromChainSpokeProvider = useSpokeProvider(selectedChainId, fromChainWalletProvider);
  const toChainSpokeProvider = useSpokeProvider(token.xChainId, toChainWalletProvider);
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(selectedChainId);

  const borrow = useBorrow(token, fromChainSpokeProvider);

  // console.log('token', token);

  const handleBorrow = async () => {
    if (!borrow.mutateAsync || !amount || !toChainSpokeProvider) return;
    const walletAddress = await toChainSpokeProvider.walletProvider.getWalletAddress();
    const params = {
      token: token.address,
      amount: parseUnits(amount, token.decimals),
      action: 'borrow',
      toChainId: token.xChainId,
      toAddress: walletAddress,
    } satisfies MoneyMarketBorrowParams;
    // console.log('borrow params', params);
    // console.log('BORROW ATTEMPT');
    // console.log('Execution chain (wallet):', selectedChainId);
    // console.log('Destination chain (toChainId):', token.xChainId);
    // console.log('Selected chain (UI only):', destinationChainId);
    // console.log('Token:', {
    //   symbol: token.symbol,
    //   address: token.address,
    //   tokenChain: token.xChainId,
    // });
    // console.log('Amount (raw):', amount);
    // console.log('Amount (parsed):', parseUnits(amount, token.decimals).toString());
    // console.log('To address:', walletAddress);

    await borrow.mutateAsync(params);
    setAmount('');
    onSuccess?.(amount);
  };

  const canBorrow = !!amount && !!borrow.mutateAsync && !borrow.isPending && !!fromChainSpokeProvider;
  // console.log('borrow source chain:', selectedChainId);
  // console.log('borrow destination chain:', token.xChainId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-cherry-grey/20">
        <DialogHeader>
          <DialogTitle className="text-center text-cherry-dark">Borrow {token.symbol}</DialogTitle>
          <DialogDescription className="text-center">Choose amount and destination chain.</DialogDescription>
        </DialogHeader>

        {/* If provider not ready, show simple loading state */}
        {!fromChainSpokeProvider ? (
          <div className="p-4 text-center text-clay">Loading provider…</div>
        ) : (
          <div className="space-y-2">
            {/* Destination chain */}
            <Label className="text-negative">Receive on chain (where assets appear)</Label>
            <ChainSelector
              selectedChainId={destinationChainId}
              selectChainId={setDestinationChainId}
              allowedChains={[token.xChainId]}
            />

            {/* Amount */}
            <div className="space-y-2">
              <Label className="text-clay">Amount</Label>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>

            {/* Wrong network */}
            {isWrongChain && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <div className="flex-1 text-sm">
                  Borrow must be executed on <b>{borrowExecutionChain}</b>.
                </div>
                <Button variant="cherry" size="sm" onClick={handleSwitchChain}>
                  Switch
                </Button>
              </div>
            )}

            {/* Error */}
            {borrow.error && (
              <div className="flex items-start gap-2 p-3 bg-negative/10 border border-negative/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-negative" />
                <p className="text-sm text-negative">{borrow.error.message}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button className="w-full" variant="cherry" onClick={handleBorrow} disabled={!canBorrow}>
            {borrow.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Borrowing…
              </>
            ) : (
              'Confirm Borrow'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
