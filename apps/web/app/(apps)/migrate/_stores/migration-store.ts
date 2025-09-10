import { createStore } from 'zustand/vanilla';
import { ICON_MAINNET_CHAIN_ID, SONIC_MAINNET_CHAIN_ID, type XToken, type SpokeChainId } from '@sodax/types';
import { spokeChainConfig } from '@sodax/sdk';

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

export type MigrationState = {
  migrationMode: 'icxsoda' | 'bnusd';
  icxsoda: MigrationModeState;
  bnusd: MigrationModeState;
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
  migrationMode: 'icxsoda',
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
      from: iconBnusdToken,
      to: sonicBnusdToken,
    },
  },
};

export const createMigrationStore = (initState: MigrationState = defaultInitState) => {
  return createStore<MigrationStore>()(set => ({
    ...initState,
    switchDirection: () =>
      set(state => {
        console.log('switching direcitons.....');
        console.log(state);
        const currentMode = state.migrationMode;
        console.log(currentMode);
        const currentState = state[currentMode];
        console.log(currentState);
        const newDirection = { from: currentState.direction.to, to: currentState.direction.from };
        console.log(newDirection);
        // Maintain correct token pairs based on migration mode
        const newCurrencies =
          currentMode === 'icxsoda'
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
    setMigrationMode: (mode: 'icxsoda' | 'bnusd') =>
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
