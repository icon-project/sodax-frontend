import { useAppStore } from '@/zustand/useAppStore';
import { useMMAllowance, useMMApprove, useRepay, useSpokeProvider } from '@sodax/dapp-kit';
import type { ChainId, MoneyMarketRepayParams, XToken } from '@sodax/sdk';
import { useEvmSwitchChain, useWalletProvider } from '@sodax/wallet-sdk-react';
import React, { useMemo, useState } from 'react';
import { parseUnits } from 'viem';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ChainSelector } from '@/components/shared/ChainSelector';
import { getChainsWithThisToken, getTokenOnChain } from '@/lib/utils';
import { useXBalances, useXAccount } from '@sodax/wallet-sdk-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: XToken;
  maxDebt: string;
  onSuccess?: (data: {
    amount: string;
    token: XToken;
    sourceChainId: ChainId;
    destinationChainId: ChainId;
  }) => void;
}
export function CrossChainActionModal({ open, onOpenChange, token, maxDebt, onSuccess }: Props) {
  const [amount, setAmount] = useState('');
  const { selectedChainId } = useAppStore();

  const [fromChainId, setFromChainId] = useState(selectedChainId);
  const [toChainId] = useState(token.xChainId);
  const { address } = useXAccount(fromChainId);

  const sourceToken = getTokenOnChain(token.symbol, fromChainId);

  // Providers
  const walletProvider = useWalletProvider(fromChainId);
  const spokeProvider = useSpokeProvider(fromChainId, walletProvider);

  //   const hasWalletBalance = (chainId: ChainId, token: XToken) => {
  //     const balance = balances?.[token.address] ?? 0n;
  //     return balance > 0n;
  //   };

  const needsBridge = fromChainId !== toChainId;

  const { mutateAsync: repay, isPending } = useRepay();

  const allChains = getChainsWithThisToken(token);
  const repayableChains = getChainsWithThisToken(token);

  // Params (same idea as your current RepayModal)
  const params: MoneyMarketRepayParams | undefined = useMemo(() => {
    if (!amount) return undefined;

    const normalizedAmount = amount.replace(',', '.');

    return {
      token: sourceToken?.address ?? token.address, // ✅ Sonic USDC when paying from Sonic
      amount: parseUnits(normalizedAmount, token.decimals),
      action: 'repay',
    };
  }, [amount, sourceToken, token.decimals, token.address]);

  const { data: hasAllowed, isLoading: isAllowanceLoading } = useMMAllowance({
    params,
    spokeProvider,
  });

  const { mutateAsync: approve, isPending: isApproving } = useMMApprove();

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(fromChainId);

  const handleRepay = async () => {
    if (!spokeProvider || !params) return;

    await repay({
      params,
      spokeProvider,
    });

    onSuccess?.({
      amount,
      token,
      sourceChainId: fromChainId,
      destinationChainId: toChainId,
    });

    onOpenChange(false);
  };

  const handleApprove = async () => {
    console.log(handleApprove, 'handleapprove');
    if (!spokeProvider || !params) return;

    await approve({
      params,
      spokeProvider,
    });
  };

  const handleMax = () => {
    setAmount(maxDebt);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Repay {token.symbol}</DialogTitle>
        </DialogHeader>
        {needsBridge && (
          <p className="text-xs text-cherry-soda">
            ⚠️ This will require background bridging from {fromChainId} to {toChainId}
          </p>
        )}

        {/* ===== TEMPORARY SIMPLE UI ===== */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            From chain: <strong>{fromChainId}</strong>
            <br />
            To chain (debt): <strong>{toChainId}</strong>
          </p>
          <div className="space-y-2">
            <Label>Repay from chain</Label>
            <ChainSelector
              selectedChainId={fromChainId}
              selectChainId={setFromChainId}
              allowedChains={repayableChains}
            />

            <p className="text-xs text-muted-foreground">
              Debt lives on: <strong>{toChainId}</strong> (cannot be changed)
            </p>
          </div>

          <Label>Amount</Label>
          <div className="flex gap-2">
            <Input value={amount} onChange={e => setAmount(e.target.value)} />
            <Button variant="outline" onClick={handleMax}>
              Max
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Max debt: {Number(maxDebt).toFixed(6)} {token.symbol}
          </p>

          {isWrongChain ? (
            <Button className="w-full" onClick={handleSwitchChain}>
              Switch to {fromChainId}
            </Button>
          ) : !hasAllowed ? (
            <Button className="w-full" variant="secondary" onClick={handleApprove} disabled={!params || isApproving}>
              {isApproving ? 'Approving…' : 'Approve'}
            </Button>
          ) : (
            <Button className="w-full" onClick={handleRepay} disabled={!params || isPending}>
              {isPending ? 'Repaying…' : 'Repay'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
