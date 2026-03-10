import { useAppStore } from '@/zustand/useAppStore';
import { useMMAllowance, useMMApprove, useRepay, useSpokeProvider } from '@sodax/dapp-kit';
import type { ChainId, MoneyMarketRepayParams, XToken } from '@sodax/sdk';
import { baseChainInfo } from '@sodax/types';
import { useEvmSwitchChain, useWalletProvider } from '@sodax/wallet-sdk-react';
import React, { useMemo, useState, useEffect } from 'react';
import { formatUnits, parseUnits } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { isValidEvmAddress } from '../typeGuards';
import { isAddress } from 'viem';
import { ErrorAlert } from '../ErrorAlert';
import { getMmErrorText } from '@/lib/utils';

interface RepayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: XToken;
  maxDebt: string;
  //If true, shows success screen inline instead of closing and calling onSuccess.
  inlineSuccess?: boolean; //Called on success. Only used when inlineSuccess is false.
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
  // Track when approve button is clicked to show "Approving..." immediately
  const [isApprovingLocal, setIsApprovingLocal] = useState(false);
  const { selectedChainId: selectedMarketChainId, openWalletModal } = useAppStore();

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
  // Track if we're in a transitional state (approving or checking allowance after approval)
  // Use local state OR hook state to ensure immediate UI feedback
  const isActuallyApproving = isApproving || isApprovingLocal;

  // Show approval needed if allowance is explicitly false or undefined
  // Don't show approval needed while approving or refetching allowance (to prevent button flicker)
  const needsSourceApproval =
    (sourceAllowed === false || (sourceAllowed === undefined && !isSourceAllowanceLoading)) && !isActuallyApproving;
  const isInApprovalFlow =
    isActuallyApproving || (isSourceAllowanceLoading && !hasSourceAllowance && sourceAllowed !== false);

  // Reset local approving state when allowance is confirmed
  useEffect(() => {
    if (hasSourceAllowance && isApprovingLocal) {
      setIsApprovingLocal(false);
    }
  }, [hasSourceAllowance, isApprovingLocal]);

  // Chain switching hook for the source chain
  const { isWrongChain: isWrongSourceChain, handleSwitchChain: handleSwitchToSource } = useEvmSwitchChain(fromChainId);

  // Market chain wallet connection guard (toAddress is needed to identify the hub wallet for debt)
  const isMissingMarketChainAddress = !toAddress;

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
      // console.error('Repay failed:', err);
      setError(getMmErrorText(err) || 'Transaction failed. Please try again.');
    }
  };

  const handleApproveSource = async (): Promise<void> => {
    setError(null);
    if (!sourceSpokeProvider || !sourceParams) return;

    setIsApprovingLocal(true);
    try {
      await approve({
        params: sourceParams,
        spokeProvider: sourceSpokeProvider,
      });
    } catch (err: unknown) {
      // console.error('Source approval failed:', err);
      setError(getMmErrorText(err) || 'Approval failed');
      setIsApprovingLocal(false);
    }
    // Note: isApprovingLocal will be reset when allowance refetch completes and hasSourceAllowance becomes true
  };

  const handleMax = () => {
    // Format maxDebt to 6 decimal places to avoid floating point precision issues
    const maxDebtNum = Number.parseFloat(maxDebt);
    if (!Number.isNaN(maxDebtNum) && maxDebtNum > 0) {
      setAmount(maxDebtNum.toFixed(6));
    } else {
      setAmount(maxDebt);
    }
  };

  const isBusy = isPending || isApproving;
  // Only consider balance "unknown" during initial load, not during background refetches
  // This prevents flickering: once we have a balance, keep showing it even during refetches
  const isBalanceUnknown = isBalancesLoading || userBalance === undefined;

  // Check if user has any debt to repay (maxDebt > 0)
  // Handle both '0' and '0.000000' formats
  const maxDebtNum = maxDebt ? Number.parseFloat(maxDebt) : 0;
  const hasDebt = !Number.isNaN(maxDebtNum) && maxDebtNum > 0;

  const handleOpenChangeInternal = (nextOpen: boolean): void => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setAmount('');
      setError(null);
      setStep('form');
      setSuccessData(null);
      setIsApprovingLocal(false);
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
      <DialogContent className="sm:max-w-md border-cherry-grey/20">
        <DialogHeader>
          <DialogTitle className="text-center text-cherry-dark">Repay {token.symbol}</DialogTitle>
          <DialogDescription className="text-center">Repay debt from your collateral chain</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* From Chain (repay from) */}
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
            <p className="text-xs text-muted-foreground">
              Your balance: {isBalanceUnknown ? '—' : userBalance.toFixed(6)} {sourceToken?.symbol || token.symbol}
            </p>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="flex items-center gap-2">
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className={!isBusy && insufficientBalance ? 'border-red-500' : ''}
                placeholder="0.0"
                disabled={isBusy}
              />
              <span>{token.symbol}</span>
              <Button type="button" variant="outline" size="sm" onClick={handleMax} disabled={isBusy || !hasDebt}>
                Max
              </Button>
            </div>

            <div className="space-y-1">
              {hasDebt && (
                <p className="text-xs text-muted-foreground">
                  Max debt: {Number(maxDebt).toFixed(6)} {token.symbol}
                </p>
              )}
              {/* Show validation messages only when user enters an amount */}
              {amount &&
                (() => {
                  const amountNum = Number.parseFloat(amount.replace(',', '.'));
                  if (Number.isNaN(amountNum) || amountNum <= 0) return null;

                  if (!hasDebt) {
                    return <ErrorAlert text="No debt to repay" variant="compact" />;
                  }

                  if (!isBalanceUnknown && insufficientBalance && !isBusy) {
                    return (
                      <ErrorAlert
                        text={`Insufficient balance. You have ${userBalance?.toFixed(6)} ${sourceToken?.symbol || token.symbol}, but need ${amountNum.toFixed(6)} ${sourceToken?.symbol || token.symbol}`}
                        variant="compact"
                      />
                    );
                  }

                  const maxDebtNum = Number.parseFloat(maxDebt);
                  if (!Number.isNaN(maxDebtNum) && amountNum > maxDebtNum) {
                    return (
                      <ErrorAlert
                        text={`Amount exceeds maximum debt: ${Number(maxDebt).toFixed(6)} ${token.symbol}`}
                        variant="compact"
                      />
                    );
                  }

                  return null;
                })()}
            </div>
          </div>
        </div>

        {error && <ErrorAlert text={error} />}

        {/* Gas fee warning - only show when user can actually repay */}
        {!isWrongSourceChain &&
          amount &&
          !insufficientBalance &&
          hasDebt &&
          (() => {
            const amountNum = Number.parseFloat(amount.replace(',', '.'));
            const maxDebtNum = Number.parseFloat(maxDebt);
            return !Number.isNaN(amountNum) && amountNum > 0 && (Number.isNaN(maxDebtNum) || amountNum <= maxDebtNum);
          })() && (
            <p className="text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200 dark:border-amber-800">
              Make sure you have enough <strong>{getNativeTokenSymbol(fromChainId)}</strong> on{' '}
              <strong>{getChainName(fromChainId)}</strong> to cover gas fees for this transaction.
            </p>
          )}

        <DialogFooter className="sm:justify-start flex-col gap-2">
          {isPending ? (
            <Button className="w-full" disabled>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Repaying…
            </Button>
          ) : isActuallyApproving ? (
            <Button className="w-full" disabled>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Approving…
            </Button>
          ) : isWrongSourceChain ? (
            <Button className="w-full" variant="cherry" onClick={handleSwitchToSource} disabled={isBusy}>
              Switch to {getChainName(fromChainId)}
            </Button>
          ) : isMissingMarketChainAddress ? (
            <Button className="w-full" variant="cherry" onClick={openWalletModal}>
              Connect Wallet on {getChainName(toChainId)}
            </Button>
          ) : !hasDebt ? (
            <Button className="w-full" variant="default" disabled>
              No debt to repay
            </Button>
          ) : needsSourceApproval || (isSourceAllowanceLoading && !hasSourceAllowance) ? (
            <Button
              className="w-full"
              variant="cherry"
              onClick={handleApproveSource}
              disabled={!sourceParams || isBusy || (isSourceAllowanceLoading && !isApproving)}
            >
              {isSourceAllowanceLoading && !hasSourceAllowance && !isApproving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking approval…
                </>
              ) : (
                `Approve ${sourceToken?.symbol || token.symbol} on ${getChainName(fromChainId)}`
              )}
            </Button>
          ) : (
            <Button
              className="w-full"
              type="button"
              variant="default"
              onClick={handleRepay}
              disabled={!sourceParams || !hasSourceAllowance || isBalanceUnknown || !amount || isBusy || !hasDebt}
            >
              Repay {token.symbol}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
