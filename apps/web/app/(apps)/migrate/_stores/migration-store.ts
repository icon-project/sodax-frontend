import { createStore } from 'zustand/vanilla';
import { ICON_MAINNET_CHAIN_ID, SONIC_MAINNET_CHAIN_ID, type XToken, type SpokeChainId } from '@sodax/types';
import { spokeChainConfig } from '@sodax/sdk';

export const MIGRATION_MODE_ICX_SODA = 'icxsoda';
export const MIGRATION_MODE_BNUSD = 'bnusd';

export type MigrationModeState = {
  direction: {
    from: SpokeChainId;
    to: SpokeChainId;
  };
  typedValue: string;
  currencies: {
    from: XToken;
    to: XToken;
  };
};

export type MigrationMode = typeof MIGRATION_MODE_ICX_SODA | typeof MIGRATION_MODE_BNUSD;

export type MigrationState = {
  migrationMode: MigrationMode;
  icxsoda: MigrationModeState;
  bnusd: MigrationModeState;
};

export type MigrationActions = {
  switchDirection: () => void;
  setTypedValue: (value: string) => void;
  setMigrationMode: (mode: MigrationMode) => void;
  setChainForCurrency: (type: 'from' | 'to', chainId: SpokeChainId, token: XToken) => void;
};

export type MigrationStore = MigrationState & MigrationActions;

export const icxToken = spokeChainConfig[ICON_MAINNET_CHAIN_ID].supportedTokens.ICX;

export const sodaToken = spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.SODA;

export const defaultInitState: MigrationState = {
  migrationMode: MIGRATION_MODE_ICX_SODA,
  icxsoda: {
    direction: { from: ICON_MAINNET_CHAIN_ID, to: SONIC_MAINNET_CHAIN_ID },
    typedValue: '',
    currencies: {
      from: icxToken,
      to: sodaToken,
    },
  },
  bnusd: {
    direction: { from: ICON_MAINNET_CHAIN_ID, to: SONIC_MAINNET_CHAIN_ID },
    typedValue: '',
    currencies: {
      from: spokeChainConfig[ICON_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
      to: spokeChainConfig[SONIC_MAINNET_CHAIN_ID].supportedTokens.bnUSD,
    },
  },
};

export const createMigrationStore = (initState: MigrationState = defaultInitState) => {
  return createStore<MigrationStore>()(set => ({
    ...initState,
    switchDirection: () =>
      set(state => {
        const currentMode = state.migrationMode;
        const currentState = state[currentMode];
        const newDirection = { from: currentState.direction.to, to: currentState.direction.from };
        // Maintain correct token pairs based on migration mode
        const newCurrencies =
          currentMode === MIGRATION_MODE_ICX_SODA
            ? newDirection.from === ICON_MAINNET_CHAIN_ID
              ? { from: icxToken, to: sodaToken }
              : { from: sodaToken, to: icxToken }
            : // For bnUSD, maintain the same token types but swap their positions
              { from: currentState.currencies.to, to: currentState.currencies.from };

        return {
          [currentMode]: {
            ...currentState,
            direction: newDirection,
            currencies: newCurrencies,
          },
        };
      }),
    setTypedValue: (value: string) =>
      set(state => ({
        [state.migrationMode]: {
          ...state[state.migrationMode],
          typedValue: value,
        },
      })),
    setMigrationMode: (mode: MigrationMode) =>
      set(state => ({
        migrationMode: mode,
      })),
    setChainForCurrency: (type: 'from' | 'to', chainId: SpokeChainId, token: XToken) =>
      set(state => {
        const currentMode = state.migrationMode;
        const currentState = state[currentMode];
        const newDirection = { ...currentState.direction };
        const newCurrencies = { ...currentState.currencies };

        if (type === 'from') {
          newDirection.from = chainId;
          newCurrencies.from = token;
        } else {
          newDirection.to = chainId;
          newCurrencies.to = token;
        }

        return {
          [currentMode]: {
            ...currentState,
            direction: newDirection,
            currencies: newCurrencies,
          },
        };
      }),
  }));
};
