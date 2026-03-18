'use client';

import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, CheckIcon, FilePenLine, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { SUPPLY_STEP } from './supply-step';
import type { SupplyStep } from './supply-step';
import { usePoolState } from '../../_stores/pool-store-provider';
import {
  createDepositParamsProps,
  createSupplyLiquidityParamsProps,
  useDexAllowance,
  useDexApprove,
  useDexDeposit,
  useSodaxContext,
  useSpokeProvider,
  useSupplyLiquidity,
} from '@sodax/dapp-kit';
import { useEvmSwitchChain, useWalletProvider } from '@sodax/wallet-sdk-react';
import { type CreateAssetDepositParams, type PoolData, type PoolSpokeAssets, dexPools } from '@sodax/sdk';
import type { Hash } from '@sodax/types';
import { chainIdToChainName } from '@/providers/constants';
import { formatUnits, parseUnits } from 'viem';

const DEX_POSITIONS_UPDATED_EVENT = 'sodax-dex-positions-updated';

interface SupplyDialogFooterProps {
  currentSupplyStep: SupplyStep;
  onSupplyStepChange: (step: SupplyStep) => void;
  isApproved: boolean;
  onApprovedChange: (approved: boolean) => void;
  isCompleted: boolean;
  onCompletedChange: (completed: boolean) => void;
  onClose: () => void;
  onError: (error: { title: string; message: string } | null) => void;
  onPendingChange: (pending: boolean) => void;
  poolData: PoolData | null;
  poolSpokeAssets: PoolSpokeAssets | null;
}

function createDexTokenIdsStorageKey(chainId: string | number, userAddress: string): string {
  return `sodax-dex-positions-${chainId}-${userAddress}`;
}

function saveTokenIdToLocalStorage(userAddress: string, chainId: string | number, tokenId: string): void {
  if (typeof globalThis.localStorage === 'undefined') {
    return;
  }

  const cleanId = tokenId.trim().toLowerCase();
  const storageKey = createDexTokenIdsStorageKey(chainId, userAddress);
  const positions = globalThis.localStorage.getItem(storageKey);
  const tokenIds = positions ? positions.split(',').map(value => value.trim()) : [];
  const hasDuplicate = tokenIds.some(id => id.trim().toLowerCase() === cleanId);

  if (hasDuplicate) {
    return;
  }

  tokenIds.push(tokenId.trim());
  globalThis.localStorage.setItem(storageKey, tokenIds.join(','));
  globalThis.dispatchEvent(
    new CustomEvent(DEX_POSITIONS_UPDATED_EVENT, {
      detail: {
        chainId,
        userAddress,
      },
    }),
  );
}

export default function SupplyDialogFooter({
  currentSupplyStep,
  onSupplyStepChange,
  isApproved,
  onApprovedChange,
  isCompleted,
  onCompletedChange,
  onClose,
  onError,
  onPendingChange,
  poolData,
  poolSpokeAssets,
}: SupplyDialogFooterProps): React.JSX.Element {
  const { sodax } = useSodaxContext();
  const { selectedNetworkChainId, minPrice, maxPrice, sodaAmount, xSodaAmount } = usePoolState();
  const [lockedSupplyAmounts, setLockedSupplyAmounts] = useState<{ token0: string; token1: string } | null>(null);
  const walletProvider = useWalletProvider(selectedNetworkChainId);
  const spokeProvider = useSpokeProvider(selectedNetworkChainId, walletProvider);
  const activeSpokeProvider = spokeProvider ?? null;
  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(selectedNetworkChainId);
  const fixedPoolKey = dexPools.ASODA_XSODA;
  const { mutateAsync: approveAsset, isPending: isApproving } = useDexApprove();
  const { mutateAsync: depositAsset, isPending: isDepositing } = useDexDeposit();
  const { mutateAsync: supplyLiquidity, isPending: isSupplying } = useSupplyLiquidity();
  const isMobile = useIsMobile();

  // Notify parent when any async operation is in-flight so it can block close.
  useEffect((): void => {
    onPendingChange(isApproving || isDepositing || isSupplying);
  }, [isApproving, isDepositing, isSupplying, onPendingChange]);

  const isTermsStep = currentSupplyStep === SUPPLY_STEP.SUPPLY_TERMS;
  const isApproveStep = currentSupplyStep === SUPPLY_STEP.SUPPLY_APPROVE;
  const isConfirmStep = currentSupplyStep === SUPPLY_STEP.SUPPLY_CONFIRM;

  const token0DepositParams = useMemo((): CreateAssetDepositParams | undefined => {
    if (!poolData || !poolSpokeAssets || !sodaAmount || Number.parseFloat(sodaAmount) <= 0) {
      return undefined;
    }
    try {
      return createDepositParamsProps({
        tokenIndex: 0,
        amount: sodaAmount,
        poolData,
        poolSpokeAssets,
      });
    } catch {
      return undefined;
    }
  }, [poolData, poolSpokeAssets, sodaAmount]);

  const token1DepositParams = useMemo((): CreateAssetDepositParams | undefined => {
    if (!poolData || !poolSpokeAssets || !xSodaAmount || Number.parseFloat(xSodaAmount) <= 0) {
      return undefined;
    }
    try {
      return createDepositParamsProps({
        tokenIndex: 1,
        amount: xSodaAmount,
        poolData,
        poolSpokeAssets,
      });
    } catch {
      return undefined;
    }
  }, [poolData, poolSpokeAssets, xSodaAmount]);
  const liquidityToken0Amount = useMemo((): string => {
    if (!poolData?.token0IsStatAToken || !poolData.token0ConversionRate) {
      return sodaAmount;
    }
    if (!sodaAmount || Number.parseFloat(sodaAmount) <= 0) {
      return sodaAmount;
    }

    try {
      const underlyingDecimals = poolData.token0UnderlyingToken?.decimals ?? 18;
      const underlyingRawAmount = parseUnits(sodaAmount, underlyingDecimals);
      const wrappedRawAmount = (underlyingRawAmount * 10n ** 18n) / poolData.token0ConversionRate;

      return formatUnits(wrappedRawAmount, poolData.token0.decimals);
    } catch {
      return sodaAmount;
    }
  }, [poolData, sodaAmount]);

  const { data: hasToken0Allowance, isLoading: isToken0AllowanceLoading } = useDexAllowance({
    params: token0DepositParams,
    spokeProvider: activeSpokeProvider,
  });
  const { data: hasToken1Allowance, isLoading: isToken1AllowanceLoading } = useDexAllowance({
    params: token1DepositParams,
    spokeProvider: activeSpokeProvider,
  });

  const canShowLeftButton = useMemo((): boolean => {
    return isMobile ? isTermsStep || isApproveStep : true;
  }, [isMobile, isTermsStep, isApproveStep]);

  const canShowMiddleButton = useMemo((): boolean => {
    return isMobile ? isApproveStep : true;
  }, [isMobile, isApproveStep]);

  const canShowRightButton = useMemo((): boolean => {
    return isMobile ? isConfirmStep || isCompleted : true;
  }, [isMobile, isConfirmStep, isCompleted]);

  const handleContinue = (): void => {
    if (isTermsStep) {
      onSupplyStepChange(SUPPLY_STEP.SUPPLY_APPROVE);
    }
  };

  const handleBack = (): void => {
    if (isApproveStep) {
      setLockedSupplyAmounts(null);
      onSupplyStepChange(SUPPLY_STEP.SUPPLY_TERMS);
    }
  };

  const handleApprove = (): void => {
    const runApprove = async (): Promise<void> => {
      if (!spokeProvider || !poolData) {
        onError({
          title: 'Pool Unavailable',
          message: 'Pool data is not available. Please try again.',
        });
        return;
      }
      if (!token0DepositParams || !token1DepositParams) {
        onError({
          title: 'Invalid Input',
          message: 'Enter valid SODA and xSODA amounts before approving.',
        });
        return;
      }
      if (isWrongChain) {
        await handleSwitchChain();
        return;
      }

      try {
        onError(null);

        if (!hasToken0Allowance) {
          await approveAsset({
            params: token0DepositParams,
            spokeProvider,
          });
        }
        if (!hasToken1Allowance) {
          await approveAsset({
            params: token1DepositParams,
            spokeProvider,
          });
        }

        // Demo flow: finish SODA -> aSODA preparation in approve step before moving to supply.
        await depositAsset({
          params: token0DepositParams,
          spokeProvider,
        });

        // Lock exact amounts used for follow-up supply to avoid drift between steps.
        setLockedSupplyAmounts({
          token0: liquidityToken0Amount,
          token1: xSodaAmount,
        });
        onApprovedChange(true);
        onSupplyStepChange(SUPPLY_STEP.SUPPLY_CONFIRM);
      } catch (error) {
        const errorObj = error as { message?: string; shortMessage?: string };
        onError({
          title: 'Approve / Deposit Failed',
          message:
            errorObj.shortMessage || errorObj.message || 'Failed to approve assets and deposit SODA for pool supply.',
        });
      }
    };

    void runApprove();
  };

  const handleSupply = (): void => {
    const runSupply = async (): Promise<void> => {
      const token0AmountForSupply = lockedSupplyAmounts?.token0 ?? liquidityToken0Amount;
      const token1AmountForSupply = lockedSupplyAmounts?.token1 ?? xSodaAmount;
      const token0AmountNum = Number.parseFloat(token0AmountForSupply);
      const token1AmountNum = Number.parseFloat(token1AmountForSupply);

      if (!poolData || !spokeProvider) {
        onError({
          title: 'Pool Unavailable',
          message: 'Pool data is not available. Please try again.',
        });
        return;
      }
      if (!token1DepositParams) {
        onError({
          title: 'Invalid Input',
          message: 'Enter a valid xSODA amount before supplying.',
        });
        return;
      }
      if (!(token0AmountNum > 0) || !(token1AmountNum > 0)) {
        onError({
          title: 'Invalid Input',
          message: 'Liquidity amounts must be greater than 0 before supplying.',
        });
        return;
      }
      if (isWrongChain) {
        await handleSwitchChain();
        return;
      }

      try {
        onError(null);

        const result = await supplyLiquidity({
          params: createSupplyLiquidityParamsProps({
            poolData,
            poolKey: fixedPoolKey,
            minPrice: minPrice.toString(),
            maxPrice: maxPrice.toString(),
            liquidityToken0Amount: token0AmountForSupply,
            liquidityToken1Amount: token1AmountForSupply,
            slippageTolerance: '0.5',
            positionId: null,
            isValidPosition: false,
          }),
          spokeProvider,
        });

        try {
          const [, hubTxHash] = result;
          const walletAddress = await spokeProvider.walletProvider.getWalletAddress();
          const mintPositionEvent = await sodax.dex.clService.getMintPositionEvent(hubTxHash as Hash);
          saveTokenIdToLocalStorage(walletAddress, selectedNetworkChainId, mintPositionEvent.tokenId.toString());
        } catch (saveError) {
          // Keep supply successful even if local position indexing fails.
          console.warn('Failed to save minted position ID to local storage', saveError);
        }

        onCompletedChange(true);
      } catch (error) {
        const errorObj = error as { message?: string; shortMessage?: string };
        onError({
          title: 'Supply Failed',
          message: errorObj.shortMessage || errorObj.message || 'Failed to create ASODA/XSODA liquidity position.',
        });
      }
    };

    void runSupply();
  };

  return (
    <DialogFooter className="flex justify-between gap-2 overflow-hidden bottom-8 md:inset-x-12 inset-x-8 absolute">
      {canShowLeftButton && (
        <Button
          variant="cherry"
          className={`text-white font-['InterRegular'] transition-all duration-300 ease-in-out ${
            isMobile
              ? 'w-full'
              : !isTermsStep
                ? 'w-10 h-10 rounded-full p-0 flex items-center justify-center'
                : 'flex flex-1'
          }`}
          onClick={isApproveStep ? handleBack : handleContinue}
          disabled={isConfirmStep}
        >
          {isApproveStep ? (
            <ArrowLeft className="w-5 h-5" />
          ) : !isTermsStep ? (
            <Check className="w-5 h-5" />
          ) : (
            'Continue'
          )}
        </Button>
      )}

      {canShowMiddleButton &&
        (isApproveStep && isWrongChain ? (
          <Button variant="cherry" className={isMobile ? 'w-full' : 'flex-1'} onClick={handleSwitchChain}>
            Switch to {chainIdToChainName(selectedNetworkChainId)}
          </Button>
        ) : (
          <Button
            variant="cherry"
            className={`text-white font-['InterRegular'] transition-all duration-300 ease-in-out ${
              isMobile ? 'w-full' : isApproveStep ? 'flex-1' : 'w-[40px]'
            }`}
            onClick={handleApprove}
            disabled={
              !isApproveStep ||
              isApproved ||
              isApproving ||
              isToken0AllowanceLoading ||
              isToken1AllowanceLoading ||
              !token0DepositParams ||
              !token1DepositParams
            }
          >
            {isApproved ? (
              <Check className="w-5 h-5" />
            ) : isTermsStep ? (
              <FilePenLine />
            ) : isApproving ? (
              <>
                Approving <Loader2 className="w-4 h-4 animate-spin ml-2" />
              </>
            ) : isDepositing ? (
              <>
                Depositing <Loader2 className="w-4 h-4 animate-spin ml-2" />
              </>
            ) : (
              'Approve Join the pool'
            )}
          </Button>
        ))}

      {canShowRightButton &&
        (isCompleted ? (
          <Button
            variant="cherry"
            className={`text-white font-['InterRegular'] rounded-full p-0 flex items-center justify-center gap-1 ${
              isMobile ? 'w-full' : 'flex-1'
            }`}
            onClick={onClose}
          >
            Liquidity position created
            <CheckIcon className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="cherry"
            className={`text-white font-['InterRegular'] transition-all duration-300 ease-in-out ${
              isMobile
                ? 'w-full'
                : isConfirmStep || isApproved
                  ? 'h-10 rounded-full p-0 flex flex-1 items-center justify-center'
                  : 'w-[140px]'
            }`}
            onClick={handleSupply}
            disabled={!isConfirmStep || isSupplying}
          >
            {isSupplying ? (
              <>
                Supplying <Loader2 className="w-4 h-4 animate-spin ml-2" />
              </>
            ) : (
              'Supply'
            )}
          </Button>
        ))}
    </DialogFooter>
  );
}
