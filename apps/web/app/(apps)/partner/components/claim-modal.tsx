'use client';
import { useEffect, useMemo, useState } from 'react';
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

import { useXAccount } from '@sodax/wallet-sdk-react';
import { SONIC_MAINNET_CHAIN_ID, spokeChainConfig, type ChainId, type Address } from '@sodax/types';
import { parseUnits } from 'viem';
import { ChainSelectDropdown } from '@/components/shared/chain-select-dropdown';
import { toast } from '@/components/ui/sonner';

import { useFeeClaimApproval } from '../utils/useFeeClaimApproval';
import { useFeeClaimExecute } from '../utils/useFeeClaimExecute';
import { useFeeClaimPreferences } from '../utils/useFeeClaimPreferences';

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: {
    symbol: string;
    decimals: number;
    address: string; // Hub asset address (on Sonic)
  };
  maxAmountToClaim: string;
  onSuccess?: (amount: string) => void;
}

export function ClaimModal({ isOpen, onClose, asset, maxAmountToClaim, onSuccess }: ClaimModalProps) {
  const [amount, setAmount] = useState('');
  const { address } = useXAccount(SONIC_MAINNET_CHAIN_ID);

  // --- RESTORED UI STATE ---
  const sonicConfig = spokeChainConfig[SONIC_MAINNET_CHAIN_ID];
  const [destinationChain, setDestinationChain] = useState<ChainId>(sonicConfig.chain.id);

  const allowedChains = useMemo<ChainId[]>(() => {
    return Object.values(spokeChainConfig)
      .filter(config => Object.values(config.supportedTokens).some(t => t.symbol === 'USDC'))
      .map(config => config.chain.id);
  }, []);

  // --- PRODUCTION HOOKS INTEGRATION ---
  const { data: prefs } = useFeeClaimPreferences();
  const { isApproved, approve, isLoading: isApprovalLoading } = useFeeClaimApproval(asset.address as Address);
  const executeClaim = useFeeClaimExecute();

  const handleClaim = async () => {
    if (!amount) return;
    const amountScaled = BigInt(parseUnits(amount, asset.decimals));

    executeClaim.mutate(
      { fromToken: asset.address, amount: amountScaled },
      {
        onSuccess: result => {
          toast.success('Claim successful', { description: `Intent: ${result.intent_hash}` });
          onSuccess?.(amount);
          onClose();
        },
        onError: err => toast.error('Claim failed', { description: err.message }),
      },
    );
  };

  useEffect(() => {
    if (isOpen) {
      setAmount(maxAmountToClaim);
    }
  }, [isOpen, maxAmountToClaim]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-cherry-grey/20">
        <DialogHeader className="items-center">
          <DialogTitle className="text-center text-cherry-dark">Claim USDC</DialogTitle>
          <DialogDescription className="text-center">
            Choose how much of your earned fees to claim and where to receive them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Destination chain */}
          <div className="space-y-2">
            <Label className="text-clay">Receive on chain</Label>
            <ChainSelectDropdown
              selectedChainId={destinationChain}
              selectChainId={setDestinationChain}
              allowedChains={allowedChains}
            />
            {prefs && (
              <p className="text-[10px] text-clay-medium italic">
                Current preference: {prefs.dstAddress.slice(0, 6)}... on chain {prefs.dstChain}
              </p>
            )}
          </div>

          {/* Amount Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-clay">Amount</Label>
              <button
                type="button"
                className="text-xs text-cherry hover:underline"
                onClick={() => setAmount(maxAmountToClaim)}
              >
                Available: {maxAmountToClaim} {asset.symbol}
              </button>
            </div>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          {/* DYNAMIC BUTTON LOGIC: Approval vs Claim */}
          {!isApproved ? (
            <Button
              className="w-full"
              variant="cherry"
              onClick={() => approve.mutate()}
              disabled={isApprovalLoading || !amount}
            >
              {isApprovalLoading ? 'Checking Allowance...' : `Approve ${asset.symbol}`}
            </Button>
          ) : (
            <Button
              className="w-full"
              variant="cherry"
              onClick={handleClaim}
              disabled={executeClaim.isPending || !amount}
            >
              {executeClaim.isPending ? 'Processing...' : 'Confirm claim'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
