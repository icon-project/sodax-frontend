'use client';

import { type ReactNode, createContext, useRef, useContext, useMemo } from 'react';
import { useStore } from 'zustand';

import { type StakeStore, createStakeStore, STAKE_MODE } from './stake-store';
import { useSpokeProvider, useStakingInfo, useStakeRatio, useConvertedAssets } from '@sodax/dapp-kit';
import { useWalletProvider } from '@sodax/wallet-sdk-react';
import { parseUnits } from 'viem';
import { SONIC_MAINNET_CHAIN_ID } from '@sodax/types';

export type StakeStoreApi = ReturnType<typeof createStakeStore>;

export const StakeStoreContext = createContext<StakeStoreApi | undefined>(undefined);

export interface StakeStoreProviderProps {
  children: ReactNode;
}

export const StakeStoreProvider = ({ children }: StakeStoreProviderProps) => {
  const storeRef = useRef<StakeStoreApi | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createStakeStore();
  }

  return <StakeStoreContext.Provider value={storeRef.current}>{children}</StakeStoreContext.Provider>;
};

export const useStakeStore = <T,>(selector: (store: StakeStore) => T): T => {
  const stakeStoreContext = useContext(StakeStoreContext);

  if (!stakeStoreContext) {
    throw new Error('useStakeStore must be used within StakeStoreProvider');
  }

  return useStore(stakeStoreContext, selector);
};

export const useStakeState = () => {
  const stakeTypedValue = useStakeStore(state => state.stakeTypedValue);
  const currentStakeStep = useStakeStore(state => state.currentStakeStep);
  const totalStakedUsdValue = useStakeStore(state => state.totalStakedUsdValue);
  const selectedToken = useStakeStore(state => state.selectedToken);
  const stakeMode = useStakeStore(state => state.stakeMode);
  const unstakeMethod = useStakeStore(state => state.unstakeMethod);
  const currentUnstakeStep = useStakeStore(state => state.currentUnstakeStep);
  const isNetworkPickerOpened = useStakeStore(state => state.isNetworkPickerOpened);
  // Fetch protocol-level total staked from a canonical chain so it is available
  // before the user selects a token/network.
  const totalStakedWalletProvider = useWalletProvider(SONIC_MAINNET_CHAIN_ID);
  const totalStakedSpokeProvider = useSpokeProvider(SONIC_MAINNET_CHAIN_ID, totalStakedWalletProvider);
  const { data: totalStakingInfo } = useStakingInfo(totalStakedSpokeProvider);

  // User-specific staking info should only load after a network/token is selected.
  const walletProvider = useWalletProvider(selectedToken?.xChainId);
  const spokeProvider = useSpokeProvider(selectedToken?.xChainId, walletProvider);
  const { data: stakingInfo, isLoading: isLoadingStakingInfo } = useStakingInfo(spokeProvider);
  const reset = useStakeStore(state => state.reset);
  // Compute stakeValue from stakeTypedValue
  const stakeValue = useMemo((): bigint => {
    if (!stakeTypedValue || stakeTypedValue === '' || stakeTypedValue === '0') {
      return 0n;
    }
    const numericValue = Number(stakeTypedValue);
    if (Number.isNaN(numericValue)) {
      return 0n;
    }
    // For staking, use selectedToken decimals; for unstaking, always 18 (xSODA)
    const decimals = stakeMode === STAKE_MODE.STAKING ? (selectedToken?.decimals ?? 18) : 18;
    try {
      return parseUnits(stakeTypedValue, decimals);
    } catch {
      return 0n;
    }
  }, [stakeTypedValue, stakeMode, selectedToken?.decimals]);

  // Get stake ratio when staking (converts SODA to xSODA)
  const { data: stakeRatio, isLoading: isLoadingStakeRatio } = useStakeRatio(
    stakeMode === STAKE_MODE.STAKING && stakeValue > 0n ? stakeValue : undefined,
  );

  // Get converted assets when unstaking (converts xSODA to SODA)
  const { data: convertedAssets, isLoading: isLoadingConvertedAssets } = useConvertedAssets(
    stakeMode === STAKE_MODE.UNSTAKING && stakeValue > 0n ? stakeValue : undefined,
  );

  const { userXSodaBalance, userXSodaValue } = useMemo(() => {
    if (!stakingInfo || isLoadingStakingInfo) {
      return { userXSodaBalance: 0n, userXSodaValue: 0n };
    }
    return {
      userXSodaBalance: stakingInfo.userXSodaBalance < parseUnits('1', 17) ? 0n : stakingInfo.userXSodaBalance,
      userXSodaValue: stakingInfo.userXSodaValue,
    };
  }, [stakingInfo, isLoadingStakingInfo]);
  const totalStaked = totalStakingInfo?.totalStaked ?? 0n;

  const stakeValueInSoda: bigint = useMemo(() => {
    if (stakeMode === STAKE_MODE.STAKING) {
      return stakeValue;
    }
    return BigInt(convertedAssets || 0);
  }, [stakeMode, stakeValue, convertedAssets]);

  const stakeValueInXSoda: bigint = useMemo(() => {
    if (stakeMode === STAKE_MODE.STAKING) {
      if (!stakeRatio) {
        return 0n;
      }
      const [, previewDepositAmount] = stakeRatio;
      return previewDepositAmount;
    }
    return stakeValue;
  }, [stakeMode, stakeValue, stakeRatio]);

  const totalUserXSodaBalance = useMemo(() => {
    if (stakeMode === STAKE_MODE.UNSTAKING) {
      return userXSodaBalance - stakeValueInXSoda;
    }

    return userXSodaBalance + stakeValueInXSoda < parseUnits('1', 17) ? 0n : userXSodaBalance + stakeValueInXSoda;
  }, [userXSodaBalance, stakeMode, stakeValueInXSoda]);

  const totalUserXSodaValue = useMemo(() => {
    if (stakeMode === STAKE_MODE.UNSTAKING) {
      return userXSodaValue - stakeValueInSoda;
    }

    return userXSodaValue + stakeValueInSoda;
  }, [userXSodaValue, stakeMode, stakeValueInSoda]);

  // Determine if we're loading calculations for totalUserXSodaBalance
  const isLoadingBalanceCalculation = useMemo(() => {
    if (stakeValue === 0n) {
      return false;
    }
    if (stakeMode === STAKE_MODE.STAKING) {
      return isLoadingStakeRatio;
    }
    return isLoadingConvertedAssets;
  }, [stakeMode, stakeValue, isLoadingStakeRatio, isLoadingConvertedAssets]);

  return {
    stakeValue,
    stakeTypedValue,
    currentStakeStep,
    totalStakedUsdValue,
    selectedToken,
    stakeMode,
    unstakeMethod,
    currentUnstakeStep,
    userXSodaBalance,
    userXSodaValue,
    stakingInfo,
    isLoadingStakingInfo,
    totalStaked,
    totalUserXSodaBalance,
    totalUserXSodaValue,
    isNetworkPickerOpened,
    isLoadingBalanceCalculation,
    reset,
  };
};

export const useStakeActions = () => {
  const setStakeTypedValue = useStakeStore(state => state.setStakeTypedValue);
  const setStakeValueByPercent = useStakeStore(state => state.setStakeValueByPercent);
  const setCurrentStakeStep = useStakeStore(state => state.setCurrentStakeStep);
  const setTotalStakedUsdValue = useStakeStore(state => state.setTotalStakedUsdValue);
  const setSelectedToken = useStakeStore(state => state.setSelectedToken);
  const setStakeMode = useStakeStore(state => state.setStakeMode);
  const resetStakeState = useStakeStore(state => state.resetStakeState);
  const setUnstakeMethod = useStakeStore(state => state.setUnstakeMethod);
  const setCurrentUnstakeStep = useStakeStore(state => state.setCurrentUnstakeStep);
  const resetUnstakeState = useStakeStore(state => state.resetUnstakeState);
  const setIsNetworkPickerOpened = useStakeStore(state => state.setIsNetworkPickerOpened);
  const reset = useStakeStore(state => state.reset);
  return {
    setStakeTypedValue,
    setStakeValueByPercent,
    setCurrentStakeStep,
    setTotalStakedUsdValue,
    setSelectedToken,
    setStakeMode,
    resetStakeState,
    setUnstakeMethod,
    setCurrentUnstakeStep,
    resetUnstakeState,
    setIsNetworkPickerOpened,
    reset,
  };
};
