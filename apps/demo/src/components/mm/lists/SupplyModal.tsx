import React, { useMemo, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown } from 'lucide-react';
import { useEvmSwitchChain, useWalletProvider } from '@sodax/wallet-sdk-react';
import { parseUnits } from 'viem';
import { useMMAllowance, useMMApprove, useSpokeProvider, useSupply } from '@sodax/dapp-kit';
import type { ChainId, XToken } from '@sodax/types';
import { useAppStore } from '@/zustand/useAppStore';
import type { MoneyMarketSupplyParams } from '@sodax/sdk';
import { getChainName } from '@/constants';
import { SimpleNetworkPicker } from '@/components/ui/network-picker';

interface SupplyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: XToken;
  availableTokens: XToken[];
  onSuccess?: (data: {
    amount: string;
    token: XToken;
    sourceChainId: ChainId;
    destinationChainId: ChainId;
  }) => void;
  maxSupply: string;
}

export function SupplyModal({ open, onOpenChange, token, availableTokens, onSuccess, maxSupply }: SupplyModalProps) {
  const [amount, setAmount] = useState('');
  const [sourceToken, setSourceToken] = useState<XToken>(token);
  const [destinationToken, setDestinationToken] = useState<XToken>(token);

  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showDestPicker, setShowDestPicker] = useState(false);

  const sourceButtonRef = useRef<HTMLButtonElement>(null);
  const destButtonRef = useRef<HTMLButtonElement>(null);

  const { selectedChainId } = useAppStore();
  const isCrossChain = sourceToken.xChainId !== destinationToken.xChainId;

  const sourceWalletProvider = useWalletProvider(sourceToken.xChainId);
  const sourceSpokeProvider = useSpokeProvider(sourceToken.xChainId, sourceWalletProvider);

  const { mutateAsync: supply, isPending, error, reset: resetError } = useSupply();

  const params: MoneyMarketSupplyParams | undefined = useMemo(() => {
    if (!amount) return undefined;
    return {
      token: sourceToken.address,
      amount: parseUnits(amount, sourceToken.decimals),
      action: 'supply',
    };
  }, [sourceToken.address, sourceToken.decimals, amount]);

  const { data: hasAllowed, isLoading: isAllowanceLoading } = useMMAllowance({
    params,
    spokeProvider: sourceSpokeProvider,
  });

  const {
    mutateAsync: approve,
    isPending: isApproving,
    error: approveError,
    reset: resetApproveError,
  } = useMMApprove();

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(sourceToken.xChainId);

  const handleSupply = async () => {
    if (!sourceSpokeProvider || !params) return;

    try {
      if (isCrossChain) {
        // TODO: Implement cross-chain supply using Swaps module
        console.log('Cross-chain supply:', {
          from: sourceToken.xChainId,
          to: destinationToken.xChainId,
        });
      } else {
        await supply({
          params,
          spokeProvider: sourceSpokeProvider,
        });
      }

      onSuccess?.({
        amount,
        token: destinationToken,
        sourceChainId: sourceToken.xChainId,
        destinationChainId: destinationToken.xChainId,
      });
      onOpenChange(false);
    } catch (err) {
      console.error('Supply failed:', err);
    }
  };

  const handleApprove = async () => {
    if (!sourceSpokeProvider || !params) return;

    try {
      await approve({
        params,
        spokeProvider: sourceSpokeProvider,
      });
    } catch (err) {
      console.error('Approve failed:', err);
    }
  };

  const handleMaxClick = () => {
    setAmount(maxSupply);
  };

  const handleOpenChangeInternal = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setAmount('');
      resetError?.();
      resetApproveError?.();
      setShowSourcePicker(false);
      setShowDestPicker(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChangeInternal}>
        <DialogContent className="sm:max-w-md border-cherry-grey/20">
          <DialogHeader>
            <DialogTitle className="text-center text-cherry-dark">Supply {token.symbol}</DialogTitle>
          </DialogHeader>

          {/* SOURCE NETWORK */}
          <div className="space-y-2">
            <Label>Supply from network</Label>
            <Button
              ref={sourceButtonRef}
              type="button"
              variant="outline"
              onClick={() => {
                setShowSourcePicker(!showSourcePicker);
                setShowDestPicker(false);
              }}
              className="w-full justify-between"
            >
              <div className="flex items-center gap-2">
                <span>{getChainName(sourceToken.xChainId)}</span>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </div>

          {/* DESTINATION NETWORK */}
          <div className="space-y-2">
            <Label>Credit position to network</Label>
            <Button
              ref={destButtonRef}
              type="button"
              variant="outline"
              onClick={() => {
                setShowDestPicker(!showDestPicker);
                setShowSourcePicker(false);
              }}
              className="w-full justify-between"
            >
              <div className="flex items-center gap-2">
                <span>{getChainName(destinationToken.xChainId)}</span>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </div>

          {isCrossChain && (
            <div className="text-sm text-amber-700 bg-amber-50 p-2 rounded-md border border-amber-200">
              ⚡ Cross-chain supply from {getChainName(sourceToken.xChainId)} to{' '}
              {getChainName(destinationToken.xChainId)}
            </div>
          )}

          {/* AMOUNT */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="flex items-center gap-2">
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.0"
              />
              <span className="text-sm text-muted-foreground">{token.symbol}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleMaxClick}
                disabled={!maxSupply || maxSupply === '0'}
              >
                Max
              </Button>
            </div>
            {maxSupply && maxSupply !== '0' && (
              <p className="text-xs text-muted-foreground">
                Max supply: {Number(maxSupply).toFixed(6)} {token.symbol}
              </p>
            )}
          </div>

          {error && <p className="text-red-500 text-sm mt-2">{error.code}</p>}
          {approveError && <p className="text-red-500 text-sm mt-2">{approveError.message}</p>}

          <DialogFooter className="sm:justify-start gap-2">
            <Button
              className="w-full"
              type="button"
              variant="cherrySoda"
              onClick={handleApprove}
              disabled={isAllowanceLoading || hasAllowed || isApproving || !params || !sourceSpokeProvider}
            >
              {isApproving ? 'Approving...' : hasAllowed ? 'Approved' : 'Approve'}
            </Button>

            {isWrongChain && (
              <Button className="w-full" variant="cherry" onClick={handleSwitchChain}>
                Switch to {getChainName(sourceToken.xChainId)}
              </Button>
            )}

            {!isWrongChain && (
              <Button
                className="w-full"
                type="button"
                variant="default"
                onClick={handleSupply}
                disabled={!hasAllowed || isPending}
              >
                {isPending ? 'Supplying...' : isCrossChain ? 'Bridge & Supply' : 'Supply'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Network Pickers */}
      <SimpleNetworkPicker
        isOpen={showSourcePicker}
        tokens={availableTokens}
        tokenSymbol={token.symbol}
        reference={sourceButtonRef.current}
        onSelect={setSourceToken}
        onClose={() => setShowSourcePicker(false)}
      />

      <SimpleNetworkPicker
        isOpen={showDestPicker}
        tokens={availableTokens}
        tokenSymbol={token.symbol}
        reference={destButtonRef.current}
        onSelect={setDestinationToken}
        onClose={() => setShowDestPicker(false)}
      />
    </>
  );
}
