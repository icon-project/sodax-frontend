'use client';
import { useState } from 'react';
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
import { AlertCircle } from 'lucide-react';

import { useSpokeProvider, useSodaxContext } from '@sodax/dapp-kit';
import { useWalletProvider, useEvmSwitchChain } from '@sodax/wallet-sdk-react';
import type { ChainId } from '@sodax/types';
import { parseUnits } from 'viem';
import { ChainSelectDropdown } from '@/components/shared/chain-select-dropdown';
import { toast } from 'sonner';

interface SwapModalProps {
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

export function SwapModal({ isOpen, onClose, asset, onSuccess }: SwapModalProps) {
  const [amount, setAmount] = useState('');
  const [selectedChain, setSelectedChain] = useState<ChainId>(asset.chainId);

  const swapExecutionChain: ChainId = asset.chainId;

  const { sodax } = useSodaxContext();
  const walletProvider = useWalletProvider(swapExecutionChain);
  const spokeProvider = useSpokeProvider(swapExecutionChain, walletProvider);
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(swapExecutionChain);
  const usdcAddressOnSameChain = spokeProvider?.chainConfig?.supportedTokens?.USDC?.address;
  const allowedChains = [asset.chainId]; // only allow swapping on asset's home chain

  const handleSwap = async () => {
    if (!spokeProvider || !walletProvider) return;

    const amountScaled = BigInt(parseUnits(amount, asset.decimals));

    const intentParams = {
      inputToken: asset.address,
      outputToken: usdcAddressOnSameChain || '',
      inputAmount: amountScaled,
      minOutputAmount: BigInt(0),
      deadline: BigInt(0),
      allowPartialFill: false,
      srcChain: asset.chainId,
      dstChain: asset.chainId,
      srcAddress: await walletProvider.getWalletAddress(),
      dstAddress: await walletProvider.getWalletAddress(),
      solver: '0x0000000000000000000000000000000000000000' as `0x${string}`,
      data: '0x' as `0x${string}`,
    };

    const approval = await sodax.swaps.isAllowanceValid({ intentParams, spokeProvider });
    if (approval.ok && !approval.value) {
      await sodax.swaps.approve({ intentParams, spokeProvider });
    }

    const swapResult = await sodax.swaps.swap({ intentParams, spokeProvider });
    if (swapResult.ok) {
      toast.success('Success!',{
        description: `Swapped ${amount}${asset.symbol} to USDC.`,
      });
      onSuccess?.(amount);
      onClose();
    } else {
      toast.error('Swap failed.',{
        description: 'There was an issue executing your swap. Please try again.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-cherry-grey/20">
        <DialogHeader>
          <DialogTitle className="text-center text-cherry-dark">Swap {asset.symbol}</DialogTitle>
          <DialogDescription className="text-center">Choose amount and destination chain.</DialogDescription>
        </DialogHeader>

        {/* If provider not ready, show simple loading state */}
        {!spokeProvider ? (
          <div className="p-4 text-center text-clay">Loading provider…</div>
        ) : (
          <div className="space-y-2">
            {/* Destination chain */}
            <Label className="text-clay">Receive on chain</Label>
            <ChainSelectDropdown
              selectedChainId={selectedChain}
              selectChainId={setSelectedChain}
              allowedChains={allowedChains}
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
                  Swap must be executed on <b>{swapExecutionChain}</b>.
                </div>
                <Button variant="cherry" size="sm" onClick={handleSwitchChain}>
                  Switch
                </Button>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button className="w-full" variant="cherry" onClick={handleSwap}>
            Confirm swap
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
