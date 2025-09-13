import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';
import type { XToken, SpokeChainId } from '@sodax/types';

export type SwapState = {
  sourceToken: XToken;
  destinationToken: XToken;
  sourceAmount: string;
  destinationAmount: string;
  isSwapAndSend: boolean;
  customDestinationAddress: string;
  slippageTolerance: number;
};

export type SwapActions = {
  setSourceToken: (token: XToken) => void;
  setDestinationToken: (token: XToken) => void;
  setSourceAmount: (amount: string) => void;
  setDestinationAmount: (amount: string) => void;
  setIsSwapAndSend: (isSwapAndSend: boolean) => void;
  setCustomDestinationAddress: (address: string) => void;
  setSlippageTolerance: (tolerance: number) => void;
  switchTokens: () => void;
  resetSwapState: () => void;
};

export type SwapStore = SwapState & SwapActions;

// Default ICON token
export const defaultIconToken: XToken = {
  name: 'ICON',
  symbol: 'ICX',
  decimals: 18,
  xChainId: '0x1.icon',
  address: 'cx0000000000000000000000000000000000000000',
};

// Default USDC token on Sonic
export const defaultUsdcToken: XToken = {
  name: 'USD Coin',
  symbol: 'USDC',
  decimals: 6,
  xChainId: 'sonic',
  address: '0x29219dd400f2Bf60E5a23d13Be72B486D4038894',
};

export const defaultSwapState: SwapState = {
  sourceToken: defaultIconToken,
  destinationToken: defaultUsdcToken,
  sourceAmount: '',
  destinationAmount: '',
  isSwapAndSend: false,
  customDestinationAddress: '',
  slippageTolerance: 0.5,
};

export const createSwapStore = (initState: SwapState = defaultSwapState) => {
  return createStore<SwapStore>()(
    persist(
      (set, get) => ({
        ...initState,
        setSourceToken: (token: XToken) => set({ sourceToken: token }),
        setDestinationToken: (token: XToken) => set({ destinationToken: token }),
        setSourceAmount: (amount: string) => set({ sourceAmount: amount }),
        setDestinationAmount: (amount: string) => set({ destinationAmount: amount }),
        setIsSwapAndSend: (isSwapAndSend: boolean) => set({ isSwapAndSend }),
        setCustomDestinationAddress: (address: string) => set({ customDestinationAddress: address }),
        setSlippageTolerance: (tolerance: number) => set({ slippageTolerance: tolerance }),
        switchTokens: () => {
          const { sourceToken, destinationToken, sourceAmount, destinationAmount } = get();
          set({
            sourceToken: destinationToken,
            destinationToken: sourceToken,
            sourceAmount: destinationAmount,
            destinationAmount: sourceAmount,
          });
        },
        resetSwapState: () => set(defaultSwapState),
      }),
      {
        name: 'sodax-swap-store',
        partialize: state => ({
          sourceToken: state.sourceToken,
          destinationToken: state.destinationToken,
          isSwapAndSend: state.isSwapAndSend,
          customDestinationAddress: state.customDestinationAddress,
          slippageTolerance: state.slippageTolerance,
        }),
      },
    ),
  );
};
