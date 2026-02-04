// apps/web/app/(apps)/stake/_stores/stake-store-provider.tsx
'use client';

import { type ReactNode, createContext, useRef, useContext, useMemo } from 'react';
import { useStore } from 'zustand';

import { type StakeStore, createStakeStore } from './stake-store';
import { useSpokeProvider, useStakingInfo } from '@sodax/dapp-kit';
import { useWalletProvider } from '@sodax/wallet-sdk-react';

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
  const stakeValue = useStakeStore(state => state.stakeValue);
  const stakeTypedValue = useStakeStore(state => state.stakeTypedValue);
  const currentStakeStep = useStakeStore(state => state.currentStakeStep);
  const totalStakedUsdValue = useStakeStore(state => state.totalStakedUsdValue);
  const selectedToken = useStakeStore(state => state.selectedToken);
  const stakeMode = useStakeStore(state => state.stakeMode);

  const walletProvider = useWalletProvider(selectedToken?.xChainId);
  const spokeProvider = useSpokeProvider(selectedToken?.xChainId, walletProvider);

  const { data: stakingInfo, isLoading: isLoadingStakingInfo } = useStakingInfo(spokeProvider);

  const { userXSodaBalance, userXSodaValue } = useMemo(() => {
    if (!stakingInfo || isLoadingStakingInfo) {
      return { userXSodaBalance: 0n, userXSodaValue: 0n };
    }
    return { userXSodaBalance: stakingInfo.userXSodaBalance, userXSodaValue: stakingInfo.userXSodaValue };
  }, [stakingInfo, isLoadingStakingInfo]);

  return {
    stakeValue,
    stakeTypedValue,
    currentStakeStep,
    totalStakedUsdValue,
    selectedToken,
    stakeMode,

    userXSodaBalance,
    userXSodaValue,
    stakingInfo,
    isLoadingStakingInfo,
  };
};

export const useStakeActions = () => {
  const setStakeValue = useStakeStore(state => state.setStakeValue);
  const setStakeTypedValue = useStakeStore(state => state.setStakeTypedValue);
  const setCurrentStakeStep = useStakeStore(state => state.setCurrentStakeStep);
  const setTotalStakedUsdValue = useStakeStore(state => state.setTotalStakedUsdValue);
  const setSelectedToken = useStakeStore(state => state.setSelectedToken);
  const setStakeMode = useStakeStore(state => state.setStakeMode);
  const resetStakeState = useStakeStore(state => state.resetStakeState);

  return {
    setStakeValue,
    setStakeTypedValue,
    setCurrentStakeStep,
    setTotalStakedUsdValue,
    setSelectedToken,
    setStakeMode,
    resetStakeState,
  };
};
