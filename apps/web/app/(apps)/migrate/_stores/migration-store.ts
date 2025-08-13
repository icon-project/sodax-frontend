import { createStore } from 'zustand/vanilla'
import { ICON_MAINNET_CHAIN_ID, SONIC_MAINNET_CHAIN_ID, XToken, type SpokeChainId } from '@sodax/types'
import { spokeChainConfig } from '@sodax/sdk'

export type MigrationState = {
  direction: {
    from: SpokeChainId
    to: SpokeChainId
  }
  typedValue: string
  currencies: {
    from: XToken
    to: XToken
  }
}

export type MigrationActions = {
  switchDirection: () => void
  setTypedValue: (value: string) => void
}

export type MigrationStore = MigrationState & MigrationActions

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

export const defaultInitState: MigrationState = {
  direction: { from: ICON_MAINNET_CHAIN_ID, to: SONIC_MAINNET_CHAIN_ID },
  typedValue: '',
  currencies: {
    from: icxToken,
    to: sodaToken,
  },
}

export const createMigrationStore = (
  initState: MigrationState = defaultInitState,
) => {
  return createStore<MigrationStore>()((set) => ({
    ...initState,
    switchDirection: () => set((state) => ({ direction: { from: state.direction.to, to: state.direction.from }, currencies: { from: state.currencies.to, to: state.currencies.from } })),
    setTypedValue: (value: string) => set({ typedValue: value }),
  }))
}
