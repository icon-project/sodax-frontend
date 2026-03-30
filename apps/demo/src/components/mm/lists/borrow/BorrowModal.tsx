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
import { useQueryClient } from '@tanstack/react-query';
import { parseUnits, formatUnits } from 'viem';
import type { MoneyMarketBorrowParams } from '@sodax/sdk';
import { useBorrow, useSpokeProvider, useReservesUsdFormat, useAToken, useUserReservesData } from '@sodax/dapp-kit';
import type { ChainId, XToken } from '@sodax/types';
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
import { MIN_BORROW_USD, MAX_BORROW_SAFETY_MARGIN, ZERO_ADDRESS } from '../../constants';
import type { FormatUserSummaryResponse } from '@sodax/sdk';
import { isUserReserveDataArray, isValidEvmAddress } from '../../typeGuards';
import { isAddress } from 'viem';
import { invalidateMmQueries } from '@/lib/invalidateMmQueries';
import { extractTxHash } from '@/lib/extractTxHash';
import { ErrorAlert } from '../../ErrorAlert';
import { getChainName } from '@/constants';
import { ActionSuccessContent, type ActionSuccessData } from '../ActionSuccessContent';
import { Loader2 } from 'lucide-react';

interface BorrowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: XToken;
  //If true, shows success screen inline instead of closing and calling onSuccess.
  inlineSuccess?: boolean; //Called on success. Only used when inlineSuccess is false.
  onSuccess?: (data: {
    amount: string;
    token: XToken;
    sourceChainId: ChainId;
    destinationChainId: ChainId;
    txHash?: `0x${string}`;
  }) => void;
  maxBorrow: string;
  priceUSD: number; //User summary from the market chain (where collateral is).Used to recalculate max borrow based on user's borrowing capacity.
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
  // 'form' | 'success' — controls which screen is shown within the dialog
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [successData, setSuccessData] = useState<ActionSuccessData | null>(null);
  const { selectedChainId, openWalletModal, isWalletModalOpen } = useAppStore();

  // Source = where collateral is & debt is created (market chain)
  const [sourceChainId] = useState(selectedChainId);

  // Destination = where borrowed funds are delivered (user can choose)
  const [destinationChainId, setDestinationChainId] = useState<ChainId>(token.xChainId);

  const queryClient = useQueryClient();

  // Get the token on the DESTINATION chain (for the token address in params)
  // This must be declared before useReserveMetrics hook
  const destinationToken = getTokenOnChain(token.symbol, destinationChainId);

  // Get all chains that support this token
  const supportedChains = getChainsWithThisToken(token);

  // Get formatted reserves for calculating available liquidity on destination chain
  const { data: formattedReserves } = useReservesUsdFormat();

  // Get user reserves for destination chain (for reserve metrics)
  const destinationWalletProvider = useWalletProvider(destinationChainId);
  const destinationSpokeProvider = useSpokeProvider(destinationChainId, destinationWalletProvider);
  const { address: destinationAddressForReserves } = useXAccount(destinationChainId);
  const { data: destinationUserReserves } = useUserReservesData({
    spokeProvider: destinationSpokeProvider,
    address: destinationAddressForReserves,
  });

  // Get reserve metrics for destination token on destination chain
  // Use destinationToken if available, otherwise fallback to original token
  const tokenForMetrics = destinationToken ?? token;
  // Validate userReserves array before passing to useReserveMetrics
  const destinationUserReservesArray = destinationUserReserves?.[0] || [];
  if (!isUserReserveDataArray(destinationUserReservesArray)) {
    throw new Error('Invalid type of variable destinationUserReserves: expected UserReserveData[]');
  }

  const destinationMetrics = useReserveMetrics({
    token: tokenForMetrics,
    formattedReserves: formattedReserves || [],
    userReserves: destinationUserReservesArray,
  });

  // Get aToken for calculating available liquidity
  // Validate aTokenAddress is a valid EVM address before using
  const rawATokenAddress = destinationMetrics.formattedReserve?.aTokenAddress;
  const aTokenAddress =
    rawATokenAddress && rawATokenAddress !== ZERO_ADDRESS && isValidEvmAddress(rawATokenAddress)
      ? rawATokenAddress
      : undefined;

  const { data: aToken } = useAToken({
    aToken: aTokenAddress ?? ZERO_ADDRESS,
    queryOptions: {
      queryKey: ['aToken', aTokenAddress, destinationChainId],
      enabled: !!aTokenAddress,
    },
  });

  // Calculate max borrow dynamically based on destination chain
  // If user has collateral, they can borrow any asset on any chain based on their borrowing capacity
  // Destination chain liquidity is an optional constraint if available
  const { maxBorrow, priceUSD } = useMemo(() => {
    if (!userSummary) {
      return { maxBorrow: initialMaxBorrow, priceUSD: initialPriceUSD };
    }

    // Calculate user's borrowing capacity (always do this if user has collateral)
    let availableBorrowsUSD = Number(userSummary.availableBorrowsUSD);

    // Fallback calculation if SDK returns 0 but user has collateral
    // NOTE: Should use currentLoanToValue (LTV), not currentLiquidationThreshold
    // LTV is the max you can borrow, liquidation threshold is when you get liquidated
    if (availableBorrowsUSD === 0 && Number(userSummary.totalCollateralUSD) > 0) {
      const totalCollateralUSD = Number(userSummary.totalCollateralUSD);
      const totalBorrowsUSD = Number(userSummary.totalBorrowsUSD);
      const currentLoanToValue = Number(userSummary.currentLoanToValue);

      // Use LTV (not liquidation threshold) for max borrowable amount
      const maxBorrowableUSD = totalCollateralUSD * currentLoanToValue;
      availableBorrowsUSD = Math.max(0, maxBorrowableUSD - totalBorrowsUSD);
    }

    // If user has no borrowing capacity, return 0
    if (availableBorrowsUSD <= 0) {
      return { maxBorrow: '0', priceUSD: initialPriceUSD };
    }

    // Use price from destination chain if available, otherwise use initial price (from token's native chain)
    const destinationPriceUSD = destinationMetrics.formattedReserve
      ? Number(destinationMetrics.formattedReserve.priceInUSD)
      : 0;
    const finalPriceUSD = destinationPriceUSD > 0 ? destinationPriceUSD : initialPriceUSD;

    // If no valid price available, can't calculate max borrow
    if (finalPriceUSD <= 0) {
      return { maxBorrow: initialMaxBorrow, priceUSD: initialPriceUSD };
    }

    // Calculate max borrow based on user's borrowing capacity
    const userLimitTokens = availableBorrowsUSD / finalPriceUSD;
    let calculatedMaxBorrow = userLimitTokens;

    // If destination chain has liquidity data, also consider that as a constraint
    if (destinationMetrics.formattedReserve && aToken) {
      let availableLiquidity: string | undefined;
      if (destinationMetrics.formattedReserve.borrowCap === '0') {
        availableLiquidity = truncateToDecimals(Number(formatUnits(
          BigInt(destinationMetrics.formattedReserve.availableLiquidity),
          aToken.decimals,
        )), 6);
      } else {
        availableLiquidity = truncateToDecimals(Math.min(
          Number.parseFloat(
            formatUnits(BigInt(destinationMetrics.formattedReserve.availableLiquidity), aToken.decimals),
          ),
          Number.parseInt(destinationMetrics.formattedReserve.borrowCap) -
            Number.parseFloat(destinationMetrics.formattedReserve.totalVariableDebt),
        ), 6);
      }

      if (availableLiquidity && Number(availableLiquidity) > 0) {
        const poolLimitTokens = Number(availableLiquidity);
        // Take the minimum of user capacity and pool liquidity
        calculatedMaxBorrow = Math.min(userLimitTokens, poolLimitTokens);
      }
    }

    // Apply safety margin and format
    const afterSafetyMargin = calculatedMaxBorrow * MAX_BORROW_SAFETY_MARGIN;
    const finalMaxBorrow = truncateToDecimals(afterSafetyMargin, 6);

    return {
      maxBorrow: finalMaxBorrow !== '0' ? finalMaxBorrow : '0',
      priceUSD: finalPriceUSD,
    };
  }, [userSummary, destinationMetrics.formattedReserve, aToken, initialMaxBorrow, initialPriceUSD]);

  // Calculate minimum borrow amount ($1 USD equivalent)
  // Imported from centralized constants for easy maintenance
  const minBorrowAmount = useMemo(() => {
    if (!destinationToken || priceUSD <= 0) return '0';
    const minTokens = MIN_BORROW_USD / priceUSD;
    return truncateToDecimals(minTokens, 6);
  }, [destinationToken, priceUSD]);

  const sourceWalletProvider = useWalletProvider(sourceChainId);
  const sourceSpokeProvider = useSpokeProvider(sourceChainId, sourceWalletProvider);

  const { address: sourceAddress } = useXAccount(sourceChainId);

  // Get the destination chain address for cross-chain borrows
  const { address: destinationAddress } = useXAccount(destinationChainId);

  const { mutateAsync: borrow, isPending, error, reset: resetBorrowError } = useBorrow();

  /**
   * token.address = destination chain token; spokeProvider = source (debt) chain;
   * toChainId = where funds are delivered (cross-chain only).
   */
  const params: MoneyMarketBorrowParams | undefined = useMemo(() => {
    if (!amount || !destinationToken) {
      return undefined;
    }

    const normalizedAmount = amount.replace(',', '.');

    const amountNum = Number.parseFloat(normalizedAmount);

    // CRITICAL: Reject zero or negative amounts
    if (amountNum <= 0 || Number.isNaN(amountNum)) {
      return undefined;
    }

    // Validate maximum borrow amount (prevent borrowing more than available)
    // Check if maxBorrow is effectively zero (e.g., '0.000000' parses to 0)
    const maxBorrowNum = maxBorrow ? Number.parseFloat(maxBorrow) : 0;
    const isMaxBorrowEffectivelyZero = maxBorrowNum <= 0 || Number.isNaN(maxBorrowNum);

    if (isMaxBorrowEffectivelyZero) {
      return undefined; // Cannot borrow when max borrow is zero
    }

    if (amountNum > maxBorrowNum) {
      return undefined; // Amount exceeds maximum borrowable
    }

    const isSameChain = sourceChainId === destinationChainId;

    // Only include toChainId and toAddress if cross-chain and destinationAddress is available
    const crossChainParams =
      isSameChain || !destinationAddress ? {} : { toChainId: destinationChainId, toAddress: destinationAddress };

    const parsedAmount = parseUnits(normalizedAmount, destinationToken.decimals);

    return {
      token: destinationToken.address, // Token on destination chain
      amount: parsedAmount,
      action: 'borrow',
      ...crossChainParams,
    };
  }, [amount, destinationToken, sourceChainId, destinationChainId, destinationAddress, maxBorrow]);

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(sourceChainId);

  // Borrow actions never require ERC-20 token approval (SDK's isAllowanceValid returns true for borrow)
  const isBusy = isPending;

  const handleBorrow = async (): Promise<void> => {
    if (!sourceSpokeProvider || !params) return;

    try {
      const normalizedAmount = amount.replace(',', '.');
      const result = await borrow({
        params,
        spokeProvider: sourceSpokeProvider, // Debt created on source chain
      });

      invalidateMmQueries(queryClient, {
        mmChainIds: [sourceChainId],
        address: sourceAddress,
        balanceChainIds: [sourceChainId, destinationChainId],
      });

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

  // Check if max borrow is effectively zero (even if formatted as '0.000000')
  const isMaxBorrowEffectivelyZero = useMemo(() => {
    if (!maxBorrow || maxBorrow === '0') return true;
    const maxBorrowNum = Number.parseFloat(maxBorrow);
    return maxBorrowNum <= 0 || Number.isNaN(maxBorrowNum);
  }, [maxBorrow]);

  const handleOpenChangeInternal = (nextOpen: boolean) => {
    // Keep modal open while wallet modal is active for smoother UX transition
    if (!nextOpen && isWalletModalOpen) {
      return;
    }
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setAmount('');
      setStep('form');
      setSuccessData(null);
      setDestinationChainId(token.xChainId); // Reset to default
      resetBorrowError?.();
    }
  };

  const isSameChain = sourceChainId === destinationChainId;
  const isCrossChainMissingDestinationAddress = !isSameChain && !destinationAddress;

  // Show success screen instead of form when transaction completes and inlineSuccess is enabled
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
          {/* Source Chain (locked - where collateral is) */}
          <div className="space-y-2">
            <Label>Borrow from (collateral chain)</Label>
            <div className="p-2 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground">
                Debt will be created on{' '}
                <span className="text-sm font-medium">{getChainName(sourceChainId) || sourceChainId}</span>
              </p>
            </div>
          </div>

          {/* Destination Chain (user selectable) */}
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
                : `Cross-chain: Collateral on ${getChainName(sourceChainId) || sourceChainId}, funds on ${getChainName(destinationChainId) || destinationChainId}`}
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
              {/* Show validation messages only when user enters an amount */}
              {amount &&
                (() => {
                  const amountNum = Number.parseFloat(amount.replace(',', '.'));
                  if (Number.isNaN(amountNum) || amountNum <= 0) return null;

                  if (isMaxBorrowEffectivelyZero && !isBusy) {
                    return (
                      <ErrorAlert
                        text="Insufficient collateral to borrow this asset. Supply more collateral to borrow."
                        variant="compact"
                      />
                    );
                  }

                  const maxBorrowNum = Number.parseFloat(maxBorrow);
                  if (!Number.isNaN(maxBorrowNum) && amountNum > maxBorrowNum && !isBusy) {
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

        {/* Gas fee warning - only show when user can actually borrow */}
        {!isWrongChain &&
          !isCrossChainMissingDestinationAddress &&
          amount &&
          !isMaxBorrowEffectivelyZero &&
          (() => {
            const amountNum = Number.parseFloat(amount.replace(',', '.'));
            const maxBorrowNum = Number.parseFloat(maxBorrow);
            return (
              !Number.isNaN(amountNum) && amountNum > 0 && (Number.isNaN(maxBorrowNum) || amountNum <= maxBorrowNum)
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
              disabled={
                !params || // params is undefined if: amount is empty, token missing, or amount below minimum
                !amount || // Additional validation: ensure amount is not empty
                isBusy // Prevent action during pending transaction
              }
            >
              Borrow {token.symbol}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
