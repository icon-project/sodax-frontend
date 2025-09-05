import { createStore } from 'zustand/vanilla';
import { ICON_MAINNET_CHAIN_ID, SONIC_MAINNET_CHAIN_ID, type XToken, type SpokeChainId } from '@sodax/types';
import { spokeChainConfig } from '@sodax/sdk';

export type MigrationState = {
  direction: {
    from: SpokeChainId;
    to: SpokeChainId;
  };
  typedValue: string;
  currencies: {
    from: XToken;
    to: XToken;
  };
  migrationMode: 'icxsoda' | 'bnusd';
};

export type MigrationActions = {
  switchDirection: () => void;
  setTypedValue: (value: string) => void;
  setMigrationMode: (mode: 'icxsoda' | 'bnusd') => void;
  setChainForCurrency: (type: 'from' | 'to', chainId: SpokeChainId, token: XToken) => void;
};

export type MigrationStore = MigrationState & MigrationActions;

// export const initMigrationStore = (): MigrationState => {
//   return { direction: { from: ICON_MAINNET_CHAIN_ID, to: SONIC_MAINNET_CHAIN_ID } }
// }

export const icxToken = {
  ...spokeChainConfig[ICON_MAINNET_CHAIN_ID].supportedTokens.ICX,
  xChainId: ICON_MAINNET_CHAIN_ID,
} as XToken;

export const sodaToken = {
  address: '0x7c7d53EEcda37a87ce0D5bf8E0b24512A48dC963',
  decimals: 18,
  symbol: 'SODA',
  xChainId: SONIC_MAINNET_CHAIN_ID,
} as XToken;

export const iconBnusdToken = {
  ...spokeChainConfig[ICON_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
  xChainId: ICON_MAINNET_CHAIN_ID,
} as XToken;

export const sonicBnusdToken = {
  ...spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
  xChainId: SONIC_MAINNET_CHAIN_ID,
} as XToken;

export const defaultInitState: MigrationState = {
  direction: { from: ICON_MAINNET_CHAIN_ID, to: SONIC_MAINNET_CHAIN_ID },
  typedValue: '',
  currencies: {
    from: icxToken,
    to: sodaToken,
  },
  migrationMode: 'icxsoda',
};

export const createMigrationStore = (initState: MigrationState = defaultInitState) => {
  return createStore<MigrationStore>()(set => ({
    ...initState,
    switchDirection: () =>
      set(state => {
        const newDirection = { from: state.direction.to, to: state.direction.from };
        // Maintain correct token pairs based on migration mode
        const newCurrencies =
          state.migrationMode === 'icxsoda'
            ? newDirection.from === ICON_MAINNET_CHAIN_ID
              ? { from: icxToken, to: sodaToken }
              : { from: sodaToken, to: icxToken }
            : newDirection.from === ICON_MAINNET_CHAIN_ID
              ? { from: iconBnusdToken, to: sonicBnusdToken }
              : { from: sonicBnusdToken, to: iconBnusdToken };

        return {
          direction: newDirection,
          currencies: newCurrencies,
        };
      }),
    setTypedValue: (value: string) => set({ typedValue: value }),
    setMigrationMode: (mode: 'icxsoda' | 'bnusd') =>
      set(state => {
        // Keep the same direction (from/to chains) but change the tokens
        const newCurrencies =
          mode === 'icxsoda' ? { from: icxToken, to: sodaToken } : { from: iconBnusdToken, to: sonicBnusdToken };

        return {
          migrationMode: mode,
          currencies: newCurrencies,
          typedValue: '', // Reset typed value when switching modes
        };
      }),
    setChainForCurrency: (type: 'from' | 'to', chainId: SpokeChainId, token: XToken) =>
      set(state => {
        const newDirection = { ...state.direction };
        const newCurrencies = { ...state.currencies };

        if (type === 'from') {
          newDirection.from = chainId;
          newCurrencies.from = token;
        } else {
          newDirection.to = chainId;
          newCurrencies.to = token;
        }

        return {
          direction: newDirection,
          currencies: newCurrencies,
        };
      }),
  }));
};
