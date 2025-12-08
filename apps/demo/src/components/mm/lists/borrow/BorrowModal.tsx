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
import { useTokenOnChain } from '@/lib/getTokenOnChain';

interface BorrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: {
    symbol: string;
    decimals: number;
    address: string; // token address on its home chain
    chainId: ChainId; // Required: reserve chain
  };
  onSuccess?: (amount: string) => void;
}

export function BorrowModal({ isOpen, onClose, asset, onSuccess }: BorrowModalProps) {
  const [amount, setAmount] = useState('');
  const [selectedChain, setSelectedChain] = useState<ChainId>(asset.chainId);

  const reserveChain: ChainId = asset.chainId;

  // 🧩 All hooks must run every render (even if data isn’t ready)
  const walletProvider = useWalletProvider(reserveChain);
  const spokeProvider = useSpokeProvider(reserveChain, walletProvider);
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(reserveChain);

  // 🧩 Access provider safely (optional chaining)
  const nativeToken = spokeProvider?.chainConfig?.supportedTokens?.[asset.symbol];
  const correctAddress =
    nativeToken && nativeToken.address === '0x0000000000000000000000000000000000000000'
      ? nativeToken.address
      : asset.address;

  // Construct the XToken safely
  const tokenOnReserveChain: XToken = {
    address: correctAddress,
    decimals: asset.decimals,
    symbol: asset.symbol,
    name: asset.symbol,
    xChainId: asset.chainId,
  };

  const tokenOnSelectedChain = useTokenOnChain(asset.symbol, selectedChain);
  const borrow = useBorrow(tokenOnReserveChain, spokeProvider);

  const handleBorrow = async () => {
    if (!borrow.mutateAsync || !amount || isWrongChain || !spokeProvider) return;

    await borrow.mutateAsync(amount);
    setAmount('');
    onSuccess?.(amount);
  };

  const canBorrow =
    !!amount && !isWrongChain && !!borrow.mutateAsync && !borrow.isPending && !!tokenOnSelectedChain && !!spokeProvider;

  const allowedChains = [asset.chainId];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-cherry-grey/20">
        <DialogHeader>
          <DialogTitle className="text-center text-cherry-dark">Borrow {asset.symbol}</DialogTitle>
          <DialogDescription className="text-center">Choose amount and destination chain.</DialogDescription>
        </DialogHeader>

        {/* If provider not ready, show simple loading state */}
        {!spokeProvider ? (
          <div className="p-4 text-center text-clay">Loading provider…</div>
        ) : (
          <div className="space-y-2">
            {/* Destination chain */}
            <Label className="text-clay">Receive on chain</Label>
            <ChainSelector
              selectedChainId={selectedChain}
              selectChainId={setSelectedChain}
              allowedChains={allowedChains}
            />

            {/* Token not available on destination */}
            {!tokenOnSelectedChain && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <p className="text-sm">
                  {asset.symbol} isn't available on <b>{selectedChain}</b>. Pick another chain.
                </p>
              </div>
            )}

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
                  Borrow must be executed on <b>{reserveChain}</b>.
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
