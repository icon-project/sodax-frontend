import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChainSelector } from '@/components/shared/ChainSelector';
import { useEvmSwitchChain, useWalletProvider, useXAccount } from '@sodax/wallet-sdk-react';
import { parseUnits, formatUnits } from 'viem';
import type { FormatUserSummaryResponse, MoneyMarketBorrowParams } from '@sodax/sdk';
import { useBorrow, useReservesUsdFormat, useAToken, useUserReservesData, useSodaxContext } from '@sodax/dapp-kit';
import type { SpokeChainKey, XToken } from '@sodax/types';
import { useAppStore } from '@/zustand/useAppStore';
import {
  getChainsWithThisToken,
  getMmErrorText,
  getTokenOnChain,
  getNativeTokenSymbol,
  formatDecimalForDisplay,
  getSafeMaxAmountForInput,
  truncateToDecimals,
} from '@/lib/utils';
import { logger } from '@/lib/logger';
import { useReserveMetrics } from '@/hooks/useReserveMetrics';
import { MAX_BORROW_SAFETY_MARGIN, ZERO_ADDRESS, AMOUNT_DISPLAY_DECIMALS } from '../../constants';
import { isUserReserveDataArray, isValidEvmAddress } from '../../typeGuards';
import { extractTxHash } from '@/lib/extractTxHash';
import { ErrorAlert } from '../../ErrorAlert';
import { getChainName } from '@/constants';
import { ActionSuccessContent, type ActionSuccessData } from '../ActionSuccessContent';
import { Loader2 } from 'lucide-react';

interface BorrowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: XToken;
  // If true, shows success screen inline instead of closing and calling onSuccess.
  inlineSuccess?: boolean; // Called on success. Only used when inlineSuccess is false.
  onSuccess?: (data: {
    amount: string;
    token: XToken;
    sourceChainId: SpokeChainKey;
    destinationChainId: SpokeChainKey;
    txHash?: `0x${string}`;
  }) => void;
  maxBorrow: string;
  priceUSD: number; // User summary from the market chain (where collateral is). Used to recalculate max borrow based on user's borrowing capacity.
  userSummary?: FormatUserSummaryResponse;
}

export function BorrowModal({
  open,
  onOpenChange,
  token,
  onSuccess,
  maxBorrow: initialMaxBorrow,
  priceUSD: initialPriceUSD,
  inlineSuccess,
  userSummary,
}: BorrowModalProps) {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [successData, setSuccessData] = useState<ActionSuccessData | null>(null);
  const { selectedChainId, openWalletModal, isWalletModalOpen } = useAppStore();
  const { sodax } = useSodaxContext();

  const sourceChainId = selectedChainId;
  const [destinationChainId, setDestinationChainId] = useState<SpokeChainKey>(token.chainKey);

  const destinationToken = getTokenOnChain(sodax, token.symbol, destinationChainId);
  const supportedChains = getChainsWithThisToken(sodax, token);

  const { data: formattedReserves } = useReservesUsdFormat();

  const { address: destinationAddressForReserves } = useXAccount(destinationChainId);
  const { data: destinationUserReserves } = useUserReservesData({
    spokeChainKey: destinationChainId,
    userAddress: destinationAddressForReserves,
  });

  const tokenForMetrics = destinationToken ?? token;
  const destinationUserReservesArray = destinationUserReserves?.[0] || [];
  if (!isUserReserveDataArray(destinationUserReservesArray)) {
    throw new Error('Invalid type of variable destinationUserReserves: expected UserReserveData[]');
  }

  const destinationMetrics = useReserveMetrics({
    token: tokenForMetrics,
    formattedReserves: formattedReserves || [],
    userReserves: destinationUserReservesArray,
  });

  const rawATokenAddress = destinationMetrics.formattedReserve?.aTokenAddress;
  const aTokenAddress =
    rawATokenAddress && rawATokenAddress !== ZERO_ADDRESS && isValidEvmAddress(rawATokenAddress)
      ? rawATokenAddress
      : undefined;

  const { data: aToken } = useAToken({ aToken: aTokenAddress });

  const maxBorrow = useMemo(() => {
    if (!userSummary) return initialMaxBorrow;

    let availableBorrowsUSD = Number(userSummary.availableBorrowsUSD);

    // Fallback: SDK can return 0 due to rounding even when collateral exists; recompute from LTV.
    if (availableBorrowsUSD === 0 && Number(userSummary.totalCollateralUSD) > 0) {
      const totalCollateralUSD = Number(userSummary.totalCollateralUSD);
      const totalBorrowsUSD = Number(userSummary.totalBorrowsUSD);
      const currentLoanToValue = Number(userSummary.currentLoanToValue);
      availableBorrowsUSD = Math.max(0, totalCollateralUSD * currentLoanToValue - totalBorrowsUSD);
    }

    if (availableBorrowsUSD <= 0) return '0';

    const destinationPriceUSD = destinationMetrics.formattedReserve
      ? Number(destinationMetrics.formattedReserve.priceInUSD)
      : 0;
    const finalPriceUSD = destinationPriceUSD > 0 ? destinationPriceUSD : initialPriceUSD;

    if (finalPriceUSD <= 0) return initialMaxBorrow;

    const userLimitTokens = availableBorrowsUSD / finalPriceUSD;
    let calculatedMaxBorrow = userLimitTokens;

    if (destinationMetrics.formattedReserve && aToken) {
      const availableLiquidityNum = Number.parseFloat(
        formatUnits(BigInt(destinationMetrics.formattedReserve.availableLiquidity), aToken.decimals),
      );
      const borrowCap = destinationMetrics.formattedReserve.borrowCap;
      const poolLimitTokens =
        borrowCap === '0'
          ? availableLiquidityNum
          : Math.min(
              availableLiquidityNum,
              Number.parseFloat(borrowCap) - Number.parseFloat(destinationMetrics.formattedReserve.totalVariableDebt),
            );

      if (poolLimitTokens > 0) {
        calculatedMaxBorrow = Math.min(userLimitTokens, poolLimitTokens);
      }
    }

    return truncateToDecimals(calculatedMaxBorrow * MAX_BORROW_SAFETY_MARGIN, AMOUNT_DISPLAY_DECIMALS);
  }, [userSummary, destinationMetrics.formattedReserve, aToken, initialMaxBorrow, initialPriceUSD]);

  const sourceWalletProvider = useWalletProvider(sourceChainId);
  const { address: sourceAddress } = useXAccount(sourceChainId);
  const { address: destinationAddress } = useXAccount(destinationChainId);

  const { mutateAsync: borrow, isPending, error, reset: resetBorrowError } = useBorrow(sourceChainId, sourceWalletProvider);

  const params: MoneyMarketBorrowParams | undefined = useMemo(() => {
    if (!amount || !destinationToken || !sourceAddress) {
      return undefined;
    }

    const normalizedAmount = amount.replace(',', '.');
    const amountNum = Number.parseFloat(normalizedAmount);

    if (amountNum <= 0 || Number.isNaN(amountNum)) {
      return undefined;
    }

    const maxBorrowNum = maxBorrow ? Number.parseFloat(maxBorrow) : 0;
    const isMaxBorrowEffectivelyZero = maxBorrowNum <= 0 || Number.isNaN(maxBorrowNum);

    if (isMaxBorrowEffectivelyZero) {
      return undefined;
    }

    if (amountNum > maxBorrowNum) {
      return undefined;
    }

    const isSameChain = sourceChainId === destinationChainId;

    const crossChainParams =
      isSameChain || !destinationAddress ? {} : { toChainId: destinationChainId, toAddress: destinationAddress };

    const parsedAmount = parseUnits(normalizedAmount, destinationToken.decimals);

    return {
      srcChainKey: sourceChainId,
      srcAddress: sourceAddress,
      token: destinationToken.address,
      amount: parsedAmount,
      action: 'borrow',
      ...crossChainParams,
    };
  }, [amount, destinationToken, sourceChainId, destinationChainId, destinationAddress, sourceAddress, maxBorrow]);

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(sourceChainId);

  const isBusy = isPending;

  const handleBorrow = async (): Promise<void> => {
    if (!sourceWalletProvider || !params) return;

    try {
      const normalizedAmount = amount.replace(',', '.');
      const result = await borrow({ params });

      const nextSuccessData: ActionSuccessData = {
        amount: normalizedAmount,
        token,
        sourceChainId,
        destinationChainId,
        txHash: extractTxHash(result),
      };

      if (inlineSuccess) {
        setSuccessData(nextSuccessData);
        setStep('success');
      } else {
        onSuccess?.(nextSuccessData);
        onOpenChange(false);
      }
    } catch (err) {
      logger.error('Borrow failed', err);
      if (err && typeof err === 'object' && 'data' in err) {
        logger.error('Borrow error details', (err as { data: unknown }).data);
      }
    }
  };

  const handleMaxClick = (): void => {
    const maxBorrowNum = Number.parseFloat(maxBorrow);
    if (maxBorrowNum > 0 && !Number.isNaN(maxBorrowNum)) {
      setAmount(getSafeMaxAmountForInput(maxBorrow));
    }
  };

  const isMaxBorrowEffectivelyZero = useMemo(() => {
    if (!maxBorrow || maxBorrow === '0') return true;
    const maxBorrowNum = Number.parseFloat(maxBorrow);
    return maxBorrowNum <= 0 || Number.isNaN(maxBorrowNum);
  }, [maxBorrow]);

  const handleOpenChangeInternal = (nextOpen: boolean) => {
    if (!nextOpen && isWalletModalOpen) {
      return;
    }
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setAmount('');
      setStep('form');
      setSuccessData(null);
      setDestinationChainId(token.chainKey);
      resetBorrowError?.();
    }
  };

  const isSameChain = sourceChainId === destinationChainId;
  const isCrossChainMissingDestinationAddress = !isSameChain && !destinationAddress;

  if (inlineSuccess && step === 'success' && successData) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChangeInternal} modal={!isWalletModalOpen}>
        <DialogContent className="sm:max-w-sm border-cherry-grey/20">
          <ActionSuccessContent action="borrow" data={successData} onClose={() => onOpenChange(false)} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChangeInternal} modal={!isWalletModalOpen}>
      <DialogContent className="sm:max-w-md border-cherry-grey/20">
        <DialogHeader>
          <DialogTitle className="text-center text-cherry-dark">Borrow {token.symbol}</DialogTitle>
          <DialogDescription className="text-center">
            {isSameChain ? 'Borrow funds on the same chain' : 'Borrow funds and deliver to another chain'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Borrow from (collateral chain)</Label>
            <div className="p-2 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground">
                Debt will be created on{' '}
                <span className="text-sm font-medium">{getChainName(sourceChainId) || sourceChainId}</span>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Deliver funds to</Label>
            <ChainSelector
              selectedChainId={destinationChainId}
              selectChainId={setDestinationChainId}
              allowedChains={supportedChains}
            />
            <p className="text-xs text-muted-foreground">
              {isSameChain
                ? 'Same-chain borrow'
                : `Cross-chain: Collateral on ${getChainName(sourceChainId) || sourceChainId}, funds on ${
                    getChainName(destinationChainId) || destinationChainId
                  }`}
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
                disabled={isBusy}
              />
              <span>{token.symbol}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleMaxClick}
                disabled={isBusy || isMaxBorrowEffectivelyZero}
              >
                Max
              </Button>
            </div>

            <div className="space-y-1">
              {!isMaxBorrowEffectivelyZero && (
                <p className="text-xs text-muted-foreground">
                  Max borrow: {formatDecimalForDisplay(maxBorrow, 4)} {token.symbol}
                </p>
              )}
              {amount &&
                (() => {
                  const inputAmountNum = Number.parseFloat(amount.replace(',', '.'));
                  if (Number.isNaN(inputAmountNum) || inputAmountNum <= 0) return null;

                  if (isMaxBorrowEffectivelyZero && !isBusy) {
                    return (
                      <ErrorAlert
                        text="Insufficient collateral to borrow this asset. Supply more collateral to borrow."
                        variant="compact"
                      />
                    );
                  }

                  const maxBorrowNum = Number.parseFloat(maxBorrow);
                  if (!Number.isNaN(maxBorrowNum) && inputAmountNum > maxBorrowNum && !isBusy) {
                    return (
                      <ErrorAlert
                        text={`Amount exceeds maximum borrowable: ${formatDecimalForDisplay(maxBorrow, 4)} ${token.symbol}`}
                        variant="compact"
                      />
                    );
                  }

                  return null;
                })()}
            </div>
          </div>
        </div>

        {error && <ErrorAlert text={getMmErrorText(error)} />}

        {!isWrongChain &&
          !isCrossChainMissingDestinationAddress &&
          amount &&
          !isMaxBorrowEffectivelyZero &&
          (() => {
            const inputAmountNum = Number.parseFloat(amount.replace(',', '.'));
            const maxBorrowNum = Number.parseFloat(maxBorrow);
            return (
              !Number.isNaN(inputAmountNum) &&
              inputAmountNum > 0 &&
              (Number.isNaN(maxBorrowNum) || inputAmountNum <= maxBorrowNum)
            );
          })() && (
            <p className="text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200 dark:border-amber-800">
              Make sure you have enough <strong>{getNativeTokenSymbol(sourceChainId)}</strong> on{' '}
              <strong>{getChainName(sourceChainId) || sourceChainId}</strong> to cover gas fees for this transaction.
            </p>
          )}

        <DialogFooter className="sm:justify-start flex-col gap-2">
          {isWrongChain ? (
            <Button className="w-full" variant="cherry" onClick={handleSwitchChain} disabled={isBusy}>
              Switch to {getChainName(sourceChainId) || sourceChainId}
            </Button>
          ) : isCrossChainMissingDestinationAddress ? (
            <Button className="w-full" variant="cherry" onClick={openWalletModal}>
              Connect Wallet on {getChainName(destinationChainId) || destinationChainId}
            </Button>
          ) : isPending ? (
            <Button className="w-full" disabled>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Borrowing...
            </Button>
          ) : (
            <Button
              className="w-full"
              type="button"
              variant="default"
              onClick={handleBorrow}
              disabled={!params || !amount || isBusy}
            >
              Borrow {token.symbol}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
