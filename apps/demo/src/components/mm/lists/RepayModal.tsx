import { useAppStore } from '@/zustand/useAppStore';
import { useMMAllowance, useMMApprove, useRepay, useSpokeProvider } from '@sodax/dapp-kit';
import type { ChainId, MoneyMarketRepayParams, XToken } from '@sodax/sdk';
import { baseChainInfo } from '@sodax/types';
import { useEvmSwitchChain, useWalletProvider } from '@sodax/wallet-sdk-react';
import React, { useMemo, useState } from 'react';
import { formatUnits, parseUnits } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ChainSelector } from '@/components/shared/ChainSelector';
import { getChainsWithThisToken, getTokenOnChain, getNativeTokenSymbol } from '@/lib/utils';
import { useXBalances, useXAccount } from '@sodax/wallet-sdk-react';
import { getChainName } from '@/constants';
import { invalidateMmQueries } from '@/lib/invalidateMmQueries';
import { extractTxHash } from '@/lib/extractTxHash';
import { ActionSuccessContent, type ActionSuccessData } from './ActionSuccessContent';
import { Loader2 } from 'lucide-react';
import { isValidEvmAddress, isErrorWithMessage } from '../typeGuards';
import { isAddress } from 'viem';

interface RepayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: XToken;
  maxDebt: string;
  /**
   * If true, shows success screen within the same dialog instead of closing and calling onSuccess.
   * This provides a smoother UX transition. If false, behaves like before (calls onSuccess and closes).
   */
  inlineSuccess?: boolean;
  /**
   * Called when transaction succeeds, only if inlineSuccess is false.
   * If inlineSuccess is true, success is shown inline and this callback is not called.
   */
  onSuccess?: (data: {
    amount: string;
    token: XToken;
    sourceChainId: ChainId;
    destinationChainId: ChainId;
    txHash?: `0x${string}`;
  }) => void;
}

export function RepayModal({ open, onOpenChange, token, maxDebt, onSuccess, inlineSuccess }: RepayModalProps) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  // UI state: tracks whether to show form or success screen within the same dialog
  const [step, setStep] = useState<'form' | 'success'>('form');
  // Stores success data (amount, token, txHash) when transaction completes, for displaying success screen
  const [successData, setSuccessData] = useState<ActionSuccessData | null>(null);
  const { selectedChainId: selectedMarketChainId } = useAppStore();

  const [fromChainId, setFromChainId] = useState(selectedMarketChainId);
  // toChainId = market chain where debt is recorded (where collateral is), NOT token.xChainId (where borrowed asset was delivered)
  const [toChainId] = useState(selectedMarketChainId);
  const { address: fromAddress } = useXAccount(fromChainId);
  const { address: toAddress } = useXAccount(toChainId);
  const queryClient = useQueryClient();

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

    // Validate addresses exist
    if (!fromAddress || !toAddress) {
      return undefined; // Addresses not available yet
    }

    // Only validate EVM address format for EVM chains (for fromAddress)
    const fromChainInfo = baseChainInfo[fromChainId as keyof typeof baseChainInfo];
    if (fromChainInfo?.type === 'EVM' && !isValidEvmAddress(fromAddress)) {
      throw new Error(
        `Invalid type of variable fromAddress in RepayModal: expected valid EVM address, got ${typeof fromAddress}`,
      );
    }

    // Only validate EVM address format for EVM chains (for toAddress)
    const toChainInfo = baseChainInfo[toChainId as keyof typeof baseChainInfo];
    if (toChainInfo?.type === 'EVM' && !isValidEvmAddress(toAddress)) {
      throw new Error(
        `Invalid type of variable toAddress in RepayModal: expected valid EVM address, got ${typeof toAddress}`,
      );
    }

    const normalizedAmount = amount.replace(',', '.');
    return {
      token: sourceToken.address,
      amount: parseUnits(normalizedAmount, sourceToken.decimals),
      action: 'repay',
      // toChainId = market chain where debt is recorded (where collateral is), NOT token.xChainId (where borrowed asset was delivered)
      toChainId: toChainId,
      toAddress: toAddress, // Address on the market chain (where debt lives)
    };
  }, [amount, sourceToken, toChainId, fromAddress, toAddress, fromChainId]);

  // Check allowance on the source chain (where tokens are spent)
  const { data: sourceAllowed, isLoading: isSourceAllowanceLoading } = useMMAllowance({
    params: sourceParams,
    spokeProvider: sourceSpokeProvider,
  });

  // Check user balance on source chain
  const {
    data: balances,
    isLoading: isBalancesLoading,
    isFetching: isBalancesFetching,
  } = useXBalances({
    xChainId: fromChainId,
    xTokens: sourceToken ? [sourceToken] : [],
    address: fromAddress,
  });

  const userBalance =
    sourceToken && balances?.[sourceToken.address] !== undefined
      ? Number(formatUnits(balances[sourceToken.address] ?? 0n, sourceToken.decimals))
      : undefined;

  const amountNum = Number(amount.replace(',', '.') || 0);
  const insufficientBalance = userBalance !== undefined && amountNum > userBalance;

  // If allowance is unknown/loading, assume approval is needed (show Approve button).
  // Only show action button when we know allowance exists.
  const hasSourceAllowance = sourceAllowed === true;
  const needsSourceApproval = sourceAllowed === false || sourceAllowed === undefined || isSourceAllowanceLoading;

  // Chain switching hook for the source chain
  const { isWrongChain: isWrongSourceChain, handleSwitchChain: handleSwitchToSource } = useEvmSwitchChain(fromChainId);

  const handleRepay = async (): Promise<void> => {
    setError(null);

    if (!sourceSpokeProvider || !sourceParams) {
      setError('Missing provider or params');
      return;
    }

    const normalizedAmount = amount.replace(',', '.');

    try {
      // Wait for transaction to complete
      const result = await repay({
        params: sourceParams,
        spokeProvider: sourceSpokeProvider,
      });

      invalidateMmQueries(queryClient, {
        mmChainIds: [toChainId],
        address: toAddress,
        balanceChainIds: [fromChainId],
      });

      const nextSuccessData: ActionSuccessData = {
        amount: normalizedAmount,
        token,
        sourceChainId: fromChainId,
        destinationChainId: toChainId,
        txHash: extractTxHash(result),
      };

      // Call success callback
      if (inlineSuccess) {
        setSuccessData(nextSuccessData);
        setStep('success');
      } else {
        onSuccess?.(nextSuccessData);
        onOpenChange(false);
      }
    } catch (err: unknown) {
      console.error('Repay failed:', err);
      setError(getErrorMessage(err, 'Transaction failed. Please try again.'));
    }
  };

  const getErrorMessage = (error: unknown, fallback = 'Approval failed'): string => {
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === 'string') return error;
    // Use type guard instead of type assertion
    if (isErrorWithMessage(error)) {
      return error.message;
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

  const isBusy = isPending || isApproving;
  // Only consider balance "unknown" during initial load, not during background refetches
  // This prevents flickering: once we have a balance, keep showing it even during refetches
  const isBalanceUnknown = isBalancesLoading || userBalance === undefined;

  // Check if user has any debt to repay (maxDebt > 0)
  const hasDebt = maxDebt && maxDebt !== '0' && Number.parseFloat(maxDebt) > 0;

  const handleOpenChangeInternal = (nextOpen: boolean): void => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setAmount('');
      setError(null);
      setStep('form');
      setSuccessData(null);
    }
  };

  // Show success screen instead of form when transaction completes and inlineSuccess is enabled
  if (inlineSuccess && step === 'success' && successData) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChangeInternal}>
        <DialogContent className="sm:max-w-sm border-cherry-grey/20">
          <ActionSuccessContent action="repay" data={successData} onClose={() => onOpenChange(false)} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChangeInternal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Repay {token.symbol}</DialogTitle>
        </DialogHeader>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{error}</div>}

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            From chain: <strong>{getChainName(fromChainId)}</strong>
            <br />
            To chain (debt): <strong>{getChainName(toChainId)}</strong>
          </p>

          <div className="space-y-2">
            <Label>Repay from chain</Label>
            <ChainSelector
              selectedChainId={fromChainId}
              selectChainId={setFromChainId}
              allowedChains={repayableChains}
            />

            <p className="text-xs text-muted-foreground">
              Debt lives on: <strong>{getChainName(toChainId)}</strong> (cannot be changed)
            </p>
            <p className="text-xs text-muted-foreground gap-2">
              Your balance on the chain you want to repay: {isBalanceUnknown ? '—' : userBalance.toFixed(6)}
              <span> {sourceToken?.symbol || token.symbol}</span>
            </p>
          </div>

          <Label>Amount</Label>
          <div className="flex gap-2">
            <Input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className={!isBusy && insufficientBalance ? 'border-red-500' : ''}
              placeholder="0.0"
              disabled={isBusy}
            />
            <Button variant="outline" onClick={handleMax} disabled={isBusy}>
              Max
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Max debt: {Number(maxDebt).toFixed(6)} {token.symbol}
          </p>

          {/* Gas fee warning - shown right before action button for maximum visibility */}
          {!isWrongSourceChain && amount && !insufficientBalance && (
            <p className="text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-200 dark:border-amber-800">
              Make sure you have enough <strong>{getNativeTokenSymbol(fromChainId)}</strong> on{' '}
              <strong>{getChainName(fromChainId)}</strong> to cover gas fees for this transaction.
            </p>
          )}

          {/* Show message when insufficient balance */}
          {!isBusy && !isBalanceUnknown && insufficientBalance && amount && (
            <div className="p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">Cannot repay with current balance</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                You have {userBalance?.toFixed(6)} {sourceToken?.symbol || token.symbol}, but need{' '}
                {amountNum.toFixed(6)} {sourceToken?.symbol || token.symbol} to repay this amount.
              </p>
            </div>
          )}

          {/* Approval and repay flow on the source (repay) chain */}
          {isPending ? (
            <Button className="w-full" disabled>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Repaying…
            </Button>
          ) : isWrongSourceChain ? (
            <Button className="w-full" onClick={handleSwitchToSource} disabled={isBusy}>
              Switch to {getChainName(fromChainId)}
            </Button>
          ) : insufficientBalance &&
            amount ? // Don't show buttons when insufficient balance - show message above instead
          null : needsSourceApproval ? (
            <Button
              className="w-full"
              variant="cherry"
              onClick={handleApproveSource}
              disabled={!sourceParams || isApproving || isBusy || !hasDebt}
            >
              {isApproving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving…
                </>
              ) : (
                `Approve ${sourceToken?.symbol || token.symbol} on ${getChainName(fromChainId)}`
              )}
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={handleRepay}
              disabled={!sourceParams || !hasSourceAllowance || isBalanceUnknown || !amount || isBusy || !hasDebt}
            >
              Repay
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
