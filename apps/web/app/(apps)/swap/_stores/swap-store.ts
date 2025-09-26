import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';
import { type XToken, ICON_MAINNET_CHAIN_ID, SONIC_MAINNET_CHAIN_ID } from '@sodax/types';
import { spokeChainConfig } from '@sodax/sdk';

export type SwapState = {
  sourceToken: XToken;
  destinationToken: XToken;
  sourceAmount: string;
  isSwapAndSend: boolean;
  customDestinationAddress: string;
  slippageTolerance: number;
};

export type SwapActions = {
  setSourceToken: (token: XToken) => void;
  setDestinationToken: (token: XToken) => void;
  setSourceAmount: (amount: string) => void;
  setIsSwapAndSend: (isSwapAndSend: boolean) => void;
  setCustomDestinationAddress: (address: string) => void;
  setSlippageTolerance: (tolerance: number) => void;
  switchTokens: () => void;
  resetSwapState: () => void;
};

export type SwapStore = SwapState & SwapActions;

export const defaultSwapState: SwapState = {
  sourceToken: spokeChainConfig[ICON_MAINNET_CHAIN_ID].supportedTokens.ICX,
  destinationToken: spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.USDC,
  sourceAmount: '',
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
        setIsSwapAndSend: (isSwapAndSend: boolean) => set({ isSwapAndSend }),
        setCustomDestinationAddress: (address: string) => set({ customDestinationAddress: address }),
        setSlippageTolerance: (tolerance: number) => set({ slippageTolerance: tolerance }),
        switchTokens: () => {
          const { sourceToken, destinationToken, sourceAmount } = get();
          set({
            sourceToken: destinationToken,
            destinationToken: sourceToken,
            sourceAmount: '',
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
