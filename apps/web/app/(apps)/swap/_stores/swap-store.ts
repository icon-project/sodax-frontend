import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';
import { type XToken, ICON_MAINNET_CHAIN_ID, SONIC_MAINNET_CHAIN_ID } from '@sodax/types';
import { spokeChainConfig } from '@sodax/sdk';

export type SwapState = {
  inputToken: XToken;
  outputToken: XToken;
  inputAmount: string;
  isSwapAndSend: boolean;
  customDestinationAddress: string;
  slippageTolerance: number;
};

export type SwapActions = {
  setInputToken: (token: XToken) => void;
  setOutputToken: (token: XToken) => void;
  setInputAmount: (amount: string) => void;
  setIsSwapAndSend: (isSwapAndSend: boolean) => void;
  setCustomDestinationAddress: (address: string) => void;
  setSlippageTolerance: (tolerance: number) => void;
  switchTokens: () => void;
  resetSwapState: () => void;
};

export type SwapStore = SwapState & SwapActions;

export const defaultSwapState: SwapState = {
  inputToken: spokeChainConfig[ICON_MAINNET_CHAIN_ID].supportedTokens.ICX,
  outputToken: spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.USDC,
  inputAmount: '',
  isSwapAndSend: false,
  customDestinationAddress: '',
  slippageTolerance: 0.5,
};

export const createSwapStore = (initState: SwapState = defaultSwapState) => {
  return createStore<SwapStore>()(
    persist(
      (set, get) => ({
        ...initState,
        setInputToken: (token: XToken) => set({ inputToken: token }),
        setOutputToken: (token: XToken) => set({ outputToken: token }),
        setInputAmount: (amount: string) => set({ inputAmount: amount }),
        setIsSwapAndSend: (isSwapAndSend: boolean) => set({ isSwapAndSend }),
        setCustomDestinationAddress: (address: string) => set({ customDestinationAddress: address }),
        setSlippageTolerance: (tolerance: number) => set({ slippageTolerance: tolerance }),
        switchTokens: () => {
          const { inputToken, outputToken, inputAmount } = get();
          set({
            inputToken: outputToken,
            outputToken: inputToken,
            inputAmount: '',
          });
        },
        resetSwapState: () => set(defaultSwapState),
      }),
      {
        name: 'sodax-swap-store',
        partialize: state => ({
          inputToken: state.inputToken,
          outputToken: state.outputToken,
          isSwapAndSend: state.isSwapAndSend,
          customDestinationAddress: state.customDestinationAddress,
          slippageTolerance: state.slippageTolerance,
        }),
      },
    ),
  );
};
