# packages/wallet-sdk-react

React layer over `wallet-sdk-core`. Provides wallet connection, disconnection, balance fetching, and account management via hooks backed by Zustand state.

## Architecture

### Core Abstractions (`src/core/`)

Two abstract base classes define the wallet integration contract:

**`XService`** — per-chain service singleton managing connectors and balances:
- `abstract getBalance(address, xToken): Promise<bigint>`
- `abstract getBalances(address, xTokens): Promise<Record<string, bigint>>`
- `getXConnectors()`, `setXConnectors()`, `getXConnectorById()`

**`XConnector`** — wallet connector (adapter over native chain SDKs):
- `abstract connect(): Promise<XAccount | undefined>`
- `abstract disconnect(): Promise<void>`
- Properties: `id`, `name`, `icon`, `xChainType`

### Chain Implementations (`src/xchains/`)

9 chain implementations, each providing an `XService` + one or more `XConnector` subclasses:

| Chain | Service | Connectors | Native SDK |
|-------|---------|-----------|------------|
| EVM | `EvmXService` | `EvmXConnector` (wraps wagmi) | wagmi + EIP-6963 discovery |
| Solana | `SolanaXService` | `SolanaXConnector` | @solana/wallet-adapter-react |
| Sui | `SuiXService` | `SuiXConnector` | @mysten/dapp-kit |
| Stellar | `StellarXService` | `StellarWalletsKitXConnector` | @creit.tech/stellar-wallets-kit |
| Injective | `InjectiveXService` | `InjectiveMetamaskXConnector`, `InjectiveKelprXConnector` | @injectivelabs/wallet-* |
| ICON | `IconXService` | `IconHanaXConnector` | icon-sdk-js |
| Bitcoin | `BitcoinXService` | `UnisatXConnector`, `XverseXConnector`, `OKXXConnector` | sats-connect |
| NEAR | `NearXService` | `NearXConnector` | @hot-labs/near-connect |
| Stacks | `StacksXService` | `StacksXConnector` | @stacks/connect |

### Zustand Store (`src/useXWagmiStore.ts`)

Centralized state with persistence:

```typescript
{
  xServices: Record<ChainType, XService>,      // All chain service singletons
  xConnections: Record<ChainType, XConnection>, // Active wallet connections (persisted to localStorage)
}
```

Middleware stack: `devtools` → `persist` → `immer`
Only `xConnections` is persisted (key: `'xwagmi-store'`).

### Provider Stack (`src/SodaxWalletProvider.tsx`)

`SodaxWalletProvider` composes native chain SDK providers:

```
SodaxWalletProvider
 ├── QueryClientProvider (React Query)
 ├── WagmiProvider (EVM)
 ├── SuiClientProvider + SuiWalletProvider (Sui)
 ├── SolanaConnectionProvider + SolanaWalletProvider (Solana)
 └── Hydrate (initializes XServices with live SDK references)
```

The `Hydrate` component (`src/Hydrate.ts`) bridges native SDK hooks into XService instances (sets `wagmiConfig`, `suiClient`, `solanaConnection`, etc.).

### Bridge to wallet-sdk-core

`useWalletProvider(spokeChainId)` hook converts XService connection state into typed `*WalletProvider` instances from `wallet-sdk-core`. This is how dapp-kit gets wallet providers for SDK operations.

## Hooks (`src/hooks/`)

- `useXConnect()` — connect to a wallet (mutation)
- `useXDisconnect()` — disconnect wallet
- `useXAccount(chainIdentifier?)` — get connected account (address + chain type)
- `useXAccounts()` — get all connected accounts
- `useXConnectors(xChainType)` — get available connectors for a chain
- `useXConnection(xChainType)` — get active connection details
- `useXService(xChainType)` — get chain service instance
- `useXBalances({xChainId, xTokens, address})` — fetch token balances (refetches every 5s)
- `useWalletProvider(spokeChainId)` — get typed wallet provider
- `useEvmSwitchChain()` — EVM network switching
- `useXSignMessage()` — cross-chain message signing

## Directory Structure

```
src/
├── index.ts                    # Barrel export
├── SodaxWalletProvider.tsx     # Root provider
├── Hydrate.ts                  # Service initialization bridge
├── useXWagmiStore.ts           # Zustand store
├── core/                       # XService + XConnector abstract classes
├── hooks/                      # All hooks
├── xchains/                    # Per-chain XService + XConnector implementations
│   ├── evm/
│   ├── solana/
│   ├── sui/
│   ├── stellar/
│   ├── injective/
│   ├── icon/
│   ├── bitcoin/
│   ├── near/
│   └── stacks/
├── actions/                    # getXChainType, getXService utilities
├── types/
└── utils/
```

## Adding a New Chain

1. Create `src/xchains/<chain>/` with `<Chain>XService.ts` and `<Chain>XConnector.ts`
2. XService must extend `XService` and implement `getBalance()` / `getBalances()`
3. XConnector must extend `XConnector` and implement `connect()` / `disconnect()`
4. Register the service in `useXWagmiStore.ts` → `initXServices()`
5. If the chain needs a native SDK provider, add it to `SodaxWalletProvider.tsx` and hydrate in `Hydrate.ts`
6. Add the `useWalletProvider` mapping for the new chain type
7. Export from `src/xchains/<chain>/index.ts` and `src/index.ts`

## Build

tsup: dual ESM (`.mjs`) + CJS (`.cjs`). React, React DOM, and React Query are externalized.
