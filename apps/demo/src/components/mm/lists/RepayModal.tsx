import { useAppStore } from '@/zustand/useAppStore';
import { useMMAllowance, useMMApprove, useRepay, useSodaxContext, useXBalances } from '@sodax/dapp-kit';
import type { MoneyMarketRepayParams } from '@sodax/sdk';
import { type SpokeChainKey, type XToken, baseChainInfo } from '@sodax/types';
import { useEvmSwitchChain, useWalletProvider } from '@sodax/wallet-sdk-react';
import React, { useMemo, useState, useEffect } from 'react';
import { formatUnits, parseUnits } from 'viem';
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
import {
  getChainsWithThisToken,
  getTokenOnChain,
  getNativeTokenSymbol,
  formatDecimalForDisplay,
  getSafeMaxAmountForInput,
  truncateToDecimals,
} from '@/lib/utils';
import { AMOUNT_DISPLAY_DECIMALS } from '../constants';
import { logger } from '@/lib/logger';
import { getXChainType, useXAccount, useXService } from '@sodax/wallet-sdk-react';
import { getChainName } from '@/constants';
import { extractTxHash } from '@/lib/extractTxHash';
import { ActionSuccessContent, type ActionSuccessData } from './ActionSuccessContent';
import { Loader2 } from 'lucide-react';
import { isValidEvmAddress } from '../typeGuards';
import { ErrorAlert } from '../ErrorAlert';
import { getMmErrorText } from '@/lib/utils';

interface RepayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: XToken;
  maxDebt: string;
  /** Chain where the debt lives (market/collateral chain). Used for toChainId and initial fromChainId. */
  debtChainId?: SpokeChainKey;
  // If true, shows success screen inline instead of closing and calling onSuccess.
  inlineSuccess?: boolean; // Called on success. Only used when inlineSuccess is false.
  onSuccess?: (data: {
    amount: string;
    token: XToken;
    sourceChainId: SpokeChainKey;
    destinationChainId: SpokeChainKey;
    txHash?: `0x${string}`;
  }) => void;
}

export function RepayModal({
  open,
  onOpenChange,
  token,
  maxDebt,
  debtChainId: debtChainIdProp,
  onSuccess,
  inlineSuccess,
}: RepayModalProps) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [successData, setSuccessData] = useState<ActionSuccessData | null>(null);
  const { selectedChainId: selectedMarketChainId, openWalletModal } = useAppStore();
  const { sodax } = useSodaxContext();

  const debtChainId = debtChainIdProp ?? token.chainKey ?? selectedMarketChainId;
  const [fromChainId, setFromChainId] = useState<SpokeChainKey>(debtChainId);
  const toChainId = debtChainId;

  const prevOpenRef = React.useRef(false);
  useEffect(() => {
    const justOpened = open && !prevOpenRef.current;
    prevOpenRef.current = open;
    if (justOpened) {
      setFromChainId(debtChainId);
    }
  }, [open, debtChainId]);
  const { address: fromAddress } = useXAccount(fromChainId);
  const { address: toAddress } = useXAccount(toChainId);

  const sourceToken = getTokenOnChain(sodax, token.symbol, fromChainId);

  const sourceWalletProvider = useWalletProvider(fromChainId);

  const { mutateAsync: repay, isPending } = useRepay(fromChainId, sourceWalletProvider);
  const { mutateAsync: approve, isPending: isApproving } = useMMApprove(fromChainId, sourceWalletProvider);

  const repayableChains = getChainsWithThisToken(sodax, token);

  const sourceParams: MoneyMarketRepayParams | undefined = useMemo(() => {
    if (!amount || !sourceToken) return undefined;

    if (!fromAddress || !toAddress) {
      return undefined;
    }

    const fromChainInfo = baseChainInfo[fromChainId as keyof typeof baseChainInfo];
    if (fromChainInfo?.type === 'EVM' && !isValidEvmAddress(fromAddress)) {
      throw new Error(
        `Invalid type of variable fromAddress in RepayModal: expected valid EVM address, got ${typeof fromAddress}`,
      );
    }

    const toChainInfo = baseChainInfo[toChainId as keyof typeof baseChainInfo];
    if (toChainInfo?.type === 'EVM' && !isValidEvmAddress(toAddress)) {
      throw new Error(
        `Invalid type of variable toAddress in RepayModal: expected valid EVM address, got ${typeof toAddress}`,
      );
    }

    const normalizedAmount = amount.replace(',', '.');
    return {
      srcChainKey: fromChainId,
      srcAddress: fromAddress,
      token: sourceToken.address,
      amount: parseUnits(normalizedAmount, sourceToken.decimals),
      action: 'repay',
      toChainId: toChainId,
      toAddress: toAddress,
    };
  }, [amount, sourceToken, toChainId, fromAddress, toAddress, fromChainId]);

  const { data: sourceAllowed, isLoading: isSourceAllowanceLoading } = useMMAllowance({ params: sourceParams });

  const xService = useXService(getXChainType(fromChainId));
  const { data: balances, isLoading: isBalancesLoading } = useXBalances({
    xService,
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

  const hasSourceAllowance = sourceAllowed === true;

  const needsSourceApproval =
    (sourceAllowed === false || (sourceAllowed === undefined && !isSourceAllowanceLoading)) && !isApproving;

  const { isWrongChain: isWrongSourceChain, handleSwitchChain: handleSwitchToSource } = useEvmSwitchChain(fromChainId);

  const isMissingMarketChainAddress = !toAddress;

  const handleRepay = async (): Promise<void> => {
    setError(null);

    if (!sourceWalletProvider || !sourceParams) {
      setError('Missing wallet provider or params');
      return;
    }

    const normalizedAmount = amount.replace(',', '.');

    try {
      const result = await repay({ params: sourceParams });

      const nextSuccessData: ActionSuccessData = {
        amount: normalizedAmount,
        token,
        sourceChainId: fromChainId,
        destinationChainId: toChainId,
        txHash: extractTxHash(result),
      };

      if (inlineSuccess) {
        setSuccessData(nextSuccessData);
        setStep('success');
      } else {
        onSuccess?.(nextSuccessData);
        onOpenChange(false);
      }
    } catch (err: unknown) {
      logger.error('Repay failed', err);
      setError(getMmErrorText(err) || 'Transaction failed. Please try again.');
    }
  };

  const handleApproveSource = async (): Promise<void> => {
    setError(null);
    if (!sourceWalletProvider || !sourceParams) return;

    try {
      await approve({ params: sourceParams });
    } catch (err: unknown) {
      logger.error('Source approval failed', err);
      setError(getMmErrorText(err) || 'Approval failed');
    }
  };

  const handleMax = () => {
    const maxDebtNum = Number.parseFloat(maxDebt);
    if (!Number.isNaN(maxDebtNum) && maxDebtNum > 0) {
      setAmount(getSafeMaxAmountForInput(maxDebt));
    }
  };

  const isBusy = isPending || isApproving;
  const isBalanceUnknown = isBalancesLoading || userBalance === undefined;

  const maxDebtNum = maxDebt ? Number.parseFloat(maxDebt) : 0;
  const hasDebt = !Number.isNaN(maxDebtNum) && maxDebtNum > 0;

  const handleOpenChangeInternal = (nextOpen: boolean): void => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setAmount('');
      setError(null);
      setStep('form');
      setSuccessData(null);
    }
  };

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
              Your balance: {isBalanceUnknown ? '—' : truncateToDecimals(userBalance, AMOUNT_DISPLAY_DECIMALS)}{' '}
              {sourceToken?.symbol || token.symbol}
            </p>
          </div>

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
                  Max debt: {formatDecimalForDisplay(maxDebt, 4)} {token.symbol}
                </p>
              )}
              {amount &&
                (() => {
                  const inputAmountNum = Number.parseFloat(amount.replace(',', '.'));
                  if (Number.isNaN(inputAmountNum) || inputAmountNum <= 0) return null;

                  if (!hasDebt) {
                    return <ErrorAlert text="No debt to repay" variant="compact" />;
                  }

                  if (!isBalanceUnknown && insufficientBalance && !isBusy) {
                    return (
                      <ErrorAlert
                        text={`Insufficient balance. You have ${truncateToDecimals(userBalance ?? 0, AMOUNT_DISPLAY_DECIMALS)} ${sourceToken?.symbol || token.symbol}, but need ${truncateToDecimals(inputAmountNum, AMOUNT_DISPLAY_DECIMALS)} ${sourceToken?.symbol || token.symbol}`}
                        variant="compact"
                      />
                    );
                  }

                  if (!Number.isNaN(maxDebtNum) && inputAmountNum > maxDebtNum) {
                    return (
                      <ErrorAlert
                        text={`Amount exceeds maximum debt: ${formatDecimalForDisplay(maxDebt, 6)} ${token.symbol}`}
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

        {!isWrongSourceChain &&
          amount &&
          !insufficientBalance &&
          hasDebt &&
          (() => {
            const inputAmountNum = Number.parseFloat(amount.replace(',', '.'));
            return (
              !Number.isNaN(inputAmountNum) &&
              inputAmountNum > 0 &&
              (Number.isNaN(maxDebtNum) || inputAmountNum <= maxDebtNum)
            );
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
          ) : isApproving ? (
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
