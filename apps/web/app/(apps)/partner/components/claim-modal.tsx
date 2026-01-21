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

import { useSodaxContext } from '@sodax/dapp-kit';
import { useWalletProvider } from '@sodax/wallet-sdk-react';
import { type IEvmWalletProvider, SONIC_MAINNET_CHAIN_ID, spokeChainConfig, type ChainId } from '@sodax/types';
import { parseUnits } from 'viem';
import { ChainSelectDropdown } from '@/components/shared/chain-select-dropdown';
import { toast } from '@/components/ui/sonner';
import { SonicSpokeProvider } from '@sodax/sdk';
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

  const sonicConfig = spokeChainConfig[SONIC_MAINNET_CHAIN_ID];

  // destination chain (default = Sonic)
  const [destinationChain, setDestinationChain] = useState<ChainId>(sonicConfig.chain.id);

  const { sodax } = useSodaxContext();

  const walletProvider = useWalletProvider(SONIC_MAINNET_CHAIN_ID) as IEvmWalletProvider | null;

  const provider = useMemo(() => {
    if (!walletProvider) return null;
    return new SonicSpokeProvider(walletProvider, sonicConfig);
  }, [walletProvider, sonicConfig]);

  const usdcHubToken = useMemo(() => {
    const token = Object.values(sonicConfig.supportedTokens).find(t => t.symbol === 'USDC');

    if (!token) {
      throw new Error('USDC not supported on Sonic');
    }

    return token;
  }, [sonicConfig]);

  const allowedChains = useMemo<ChainId[]>(() => {
    return Object.values(spokeChainConfig)
      .filter(config => Object.values(config.supportedTokens).some(t => t.symbol === 'USDC'))
      .map(config => config.chain.id);
  }, []);

  const handleClaim = async () => {
    if (!provider || !walletProvider) return;

    const amountScaled = BigInt(parseUnits(amount, asset.decimals));

    const intentParams = {
      inputToken: asset.address,
      outputToken: usdcHubToken.address,
      inputAmount: amountScaled,
      minOutputAmount: BigInt(0),
      deadline: BigInt(0),
      allowPartialFill: false,
      srcChain: sonicConfig.chain.id,
      dstChain: destinationChain,
      srcAddress: await walletProvider.getWalletAddress(),
      dstAddress: await walletProvider.getWalletAddress(),
      solver: '0x0000000000000000000000000000000000000000' as `0x${string}`,
      data: '0x' as `0x${string}`,
    };

    const allowance = await sodax.swaps.isAllowanceValid({
      intentParams,
      spokeProvider: provider,
    });

    if (allowance.ok && !allowance.value) {
      await sodax.swaps.approve({
        intentParams,
        spokeProvider: provider,
      });
    }

    const result = await sodax.swaps.createIntent({
      intentParams,
      spokeProvider: provider,
    });

    if (result.ok) {
      toast.success('Claim submitted', {
        description: 'USDC will arrive on the selected chain.',
      });
      onSuccess?.(amount);
      onClose();
    } else {
      toast.error('Claim failed');
    }
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
        <div className="space-y-2">
          {/* Destination chain */}
          <Label className="text-clay">Receive on chain</Label>
          <ChainSelectDropdown
            selectedChainId={destinationChain}
            selectChainId={setDestinationChain}
            allowedChains={allowedChains}
          />

          {/* Amount */}
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

        <DialogFooter>
          <Button className="w-full" variant="cherry" onClick={handleClaim} disabled={!provider || !amount}>
            Confirm claim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
