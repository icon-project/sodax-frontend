import { useAppStore } from '@/zustand/useAppStore';
import { useMMAllowance, useMMApprove, useRepay, useSpokeProvider } from '@sodax/dapp-kit';
import type { ChainId, MoneyMarketRepayParams, XToken } from '@sodax/sdk';
import { useEvmSwitchChain, useWalletProvider } from '@sodax/wallet-sdk-react';
import React, { useMemo, useState } from 'react';
import { formatUnits, parseUnits } from 'viem';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ChainSelector } from '@/components/shared/ChainSelector';
import { getChainsWithThisToken, getTokenOnChain } from '@/lib/utils';
import { useXBalances, useXAccount } from '@sodax/wallet-sdk-react';
import { getChainName } from '@/constants';

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
    txHash?: `0x${string}`;
  }) => void;
}

export function RepayActionModal({ open, onOpenChange, token, maxDebt, onSuccess }: Props) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { selectedChainId } = useAppStore();

  const [fromChainId, setFromChainId] = useState(selectedChainId);
  const [toChainId] = useState(token.xChainId);
  const { address } = useXAccount(fromChainId);

  const sourceToken = getTokenOnChain(token.symbol, fromChainId);
  const targetToken = token; // Debt token on target chain

  // Wallet provider for the source (repay) chain
  const sourceWalletProvider = useWalletProvider(fromChainId);

  // Spoke provider where the actual repay happens (source chain)
  const sourceSpokeProvider = useSpokeProvider(fromChainId, sourceWalletProvider);

  const { mutateAsync: repay, isPending } = useRepay();
  const { mutateAsync: approve, isPending: isApproving } = useMMApprove();

  const repayableChains = getChainsWithThisToken(token);

  // Source chain params (where funds come from)
  const sourceParams: MoneyMarketRepayParams | undefined = useMemo(() => {
    if (!amount || !sourceToken) return undefined;
    const normalizedAmount = amount.replace(',', '.');
    return {
      token: sourceToken.address,
      amount: parseUnits(normalizedAmount, sourceToken.decimals),
      action: 'repay',
      toChainId: toChainId, // ADD THIS - where the debt is
      toAddress: address as `0x${string}`, // ADD THIS - whose debt to repay
    };
  }, [amount, sourceToken, toChainId, address]);

  // Check allowance on the source chain (where tokens are spent)
  const { data: sourceAllowed, isLoading: isSourceAllowanceLoading } = useMMAllowance({
    params: sourceParams,
    spokeProvider: sourceSpokeProvider,
  });

  // Check user balance on source chain
  const { data: balances } = useXBalances({
    xChainId: fromChainId,
    xTokens: sourceToken ? [sourceToken] : [],
    address,
  });

  const userBalance =
    sourceToken && balances?.[sourceToken.address]
      ? Number(formatUnits(balances[sourceToken.address], sourceToken.decimals))
      : 0;

  const amountNum = Number(amount || 0);
  const insufficientBalance = amountNum > userBalance;

  // Determine which approvals are needed (only source chain)
  const needsSourceApproval = !sourceAllowed;

  // Chain switching hook for the source chain
  const { isWrongChain: isWrongSourceChain, handleSwitchChain: handleSwitchToSource } = useEvmSwitchChain(fromChainId);

  const extractTxHash = (result: unknown): `0x${string}` | undefined => {
    if (!result || typeof result !== 'object') {
      return undefined;
    }

    // Try direct fields first (future-proofing)
    const directCandidate =
      (result as { txHash?: `0x${string}`; hash?: `0x${string}` }).txHash ??
      (result as { txHash?: `0x${string}`; hash?: `0x${string}` }).hash;

    if (typeof directCandidate === 'string') {
      return directCandidate;
    }

    // Handle Money Market pattern: { ok: true, value: [spokeTxHash, hubTxHash] }
    if ('value' in result) {
      const value = (result as { value?: unknown }).value;

      if (Array.isArray(value)) {
        const [spokeTxHash, hubTxHash] = value as [unknown, unknown];

        if (typeof spokeTxHash === 'string') {
          return spokeTxHash as `0x${string}`;
        }

        if (typeof hubTxHash === 'string') {
          return hubTxHash as `0x${string}`;
        }
      }
    }

    return undefined;
  };

  const handleRepay = async (): Promise<void> => {
    setError(null);

    if (!sourceSpokeProvider || !sourceParams) {
      setError('Missing provider or params');
      return;
    }

    try {
      // Wait for transaction to complete
      const result = await repay({
        params: sourceParams,
        spokeProvider: sourceSpokeProvider,
      });

      console.log('Repay result:', result);

      // Call success callback
      onSuccess?.({
        amount,
        token,
        sourceChainId: fromChainId,
        destinationChainId: toChainId,
        txHash: extractTxHash(result),
      });

      onOpenChange(false);
    } catch (err: unknown) {
      console.error('Repay failed:', err);
      setError(getErrorMessage(err, 'Transaction failed. Please try again.'));
    }
  };

  const getErrorMessage = (error: unknown, fallback = 'Approval failed'): string => {
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === 'string') return error;
    if (typeof (error as { message?: string }).message === 'string') {
      return (error as { message: string }).message;
    }
    return fallback;
  };

  const handleApproveSource = async (): Promise<void> => {
    setError(null);
    if (!sourceSpokeProvider || !sourceParams) return;

    try {
      await approve({
        params: sourceParams,
        spokeProvider: sourceSpokeProvider,
      });
    } catch (err: unknown) {
      console.error('Source approval failed:', err);
      setError(getErrorMessage(err));
    }
  };

  const handleMax = () => {
    setAmount(maxDebt);
  };

  console.log('Allowance check result:', sourceAllowed);
  console.log('Params:', sourceParams);
  console.log('Source token:', sourceToken);
  console.log({
    amount,
    sourceToken,
    sourceParams,
    sourceSpokeProvider,
  });
  console.log('FROM CHAIN ID:', fromChainId);
  console.log('SOURCE TOKEN CHAIN:', sourceToken?.xChainId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Repay {token.symbol}</DialogTitle>
        </DialogHeader>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{error}</div>}

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
            <p className="text-xs text-muted-foreground">
              Your balance on the chain you want to repay: {userBalance.toFixed(6)}{' '}
              {sourceToken?.symbol || token.symbol}
            </p>
          </div>

          <Label>Amount</Label>
          <div className="flex gap-2">
            <Input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className={insufficientBalance ? 'border-red-500' : ''}
              placeholder="0.0"
            />
            <Button variant="outline" onClick={handleMax}>
              Max
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Max debt: {Number(maxDebt).toFixed(6)} {token.symbol}
          </p>

          {insufficientBalance && <p className="text-xs text-red-600">Insufficient balance on {fromChainId}</p>}

          {/* Approval and repay flow on the source (repay) chain */}
          {needsSourceApproval ? (
            isWrongSourceChain ? (
              <Button className="w-full" onClick={handleSwitchToSource}>
                Switch to {getChainName(fromChainId)}
              </Button>
            ) : (
              <Button
                className="w-full"
                variant="secondary"
                onClick={handleApproveSource}
                disabled={!sourceParams || isApproving || insufficientBalance}
              >
                {isApproving
                  ? 'Approving…'
                  : `Approve ${sourceToken?.symbol || token.symbol} on ${getChainName(fromChainId)}`}
              </Button>
            )
          ) : isWrongSourceChain ? (
            <Button className="w-full" onClick={handleSwitchToSource}>
              Switch to {fromChainId}
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={handleRepay}
              disabled={!sourceParams || isPending || insufficientBalance || !amount}
            >
              {isPending ? 'Repaying…' : 'Repay'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
