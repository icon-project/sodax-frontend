# packages/wallet-sdk-react

React layer over `wallet-sdk-core`. Provides wallet connection, disconnection, signing, and account management via hooks backed by Zustand state.

## Architecture

### Core Abstractions (`src/core/`)

Two abstract base classes define the wallet integration contract:

**`XService`** — per-chain service singleton managing connectors and balances:
- `getBalance(address, xToken: XToken): Promise<bigint>` — balance of a specific token
- `getBalances(address, xTokens: XToken[]): Promise<Record<string, bigint>>` — balances of multiple tokens
- `getXConnectors()`, `setXConnectors()`, `getXConnectorById()`

**`XConnector`** — wallet connector (adapter over native chain SDKs):
- `abstract connect(): Promise<XAccount | undefined>`
- `abstract disconnect(): Promise<void>`
- Properties: `id`, `name`, `icon`, `xChainType`

### Chain Registry (`src/chainRegistry.ts`)

Central dispatch for all 9 chains. Each chain registers a `ChainServiceFactory`:

```typescript
{
  createService: (rpcConfig?) => XService,
  defaultConnectors: () => XConnector[],
  providerManaged: boolean,               // true = needs React provider (EVM/Solana/Sui)
  createActions?: (service, getStore) => ChainActions,
  createWalletProvider?: (service, getStore) => WalletProvider,
  discoverConnectors?: (service, getStore) => Promise<void>,
}
```

`createChainServices()` iterates the registry, creates services and connectors for enabled chains, registers `ChainActions` for non-provider chains, and triggers async connector discovery (Stellar, NEAR).

### Provider-Managed vs Non-Provider Chains

**Provider-managed** (`providerManaged: true`): EVM, Solana, Sui
- Need React context providers (wagmi, @solana/wallet-adapter, @mysten/dapp-kit)
- Each has a **Provider/Hydrator/Actions trio** under `src/providers/<chain>/`
- **Single writer pattern**: Hydrator is the sole writer for connection state + wallet providers. Actions only trigger native SDK operations (connect/disconnect), never write state directly

**Non-provider** (`providerManaged: false`): Bitcoin, ICON, Injective, Stellar, NEAR, Stacks
- Use direct browser extension APIs
- `ChainActions` registered by `chainRegistry` during `createChainServices()`
- Wallet providers created as side-effect in `setXConnection()`
- **Bitcoin `signMessage`**: auto-detects address type — BIP-322 for P2WPKH/P2TR, ECDSA for P2SH/P2PKH (same logic as SDK `BitcoinSpokeProvider.authenticateWithWallet`)

### Provider/Hydrator/Actions Pattern (EVM, Solana, Sui)

Each provider-managed chain has 3 components:

| Component | Role |
|-----------|------|
| `<Chain>Provider` | Wraps native SDK providers (wagmi, wallet-adapter, dapp-kit) |
| `<Chain>Hydrator` | Reads native SDK hooks → writes connection state + wallet providers to store |
| `<Chain>Actions` | Registers `ChainActions` using refs to native SDK hooks. Triggers SDK operations only |

### Zustand Store (`src/useXWalletStore.ts`)

Centralized state with persistence:

```typescript
{
  xServices: Partial<Record<ChainType, XService>>,
  xConnections: Partial<Record<ChainType, XConnection>>,     // persisted to localStorage
  xConnectorsByChain: Partial<Record<ChainType, XConnector[]>>,
  enabledChains: ChainType[],
  chainActions: Record<string, ChainActions>,
  walletProviders: Partial<Record<ChainType, WalletProvider>>,
}
```

Middleware stack: `devtools` → `persist` → `immer`
Only `xConnections` is persisted (key: `'xwagmi-store'`).

**`useXWagmiStore`** is a deprecated alias for `useXWalletStore`.

### Configurable Chain Opt-In

`SodaxWalletProvider` accepts a `config` prop (`SodaxWalletConfig`):

```typescript
{
  chains: {
    EVM?: EvmChainConfig,      // reconnectOnMount, ssr, initialState
    SOLANA?: SolanaChainConfig, // autoConnect
    SUI?: SuiChainConfig,      // autoConnect, network, rpcUrl
    BITCOIN?: SimpleChainConfig,
    ICON?: SimpleChainConfig,
    // ... etc
  },
  rpcConfig?: RpcConfig,
}
```

Only listed chains are mounted. Legacy props (`rpcConfig`, `options`, `initialState`) are converted via `resolveLegacyProps()` with all 9 chains enabled.

### Provider Stack (`src/SodaxWalletProvider.tsx`)

```
SodaxWalletProvider
 ├── WalletConfigProvider (React context for config)
 ├── EvmProvider (wagmi — if chains.EVM)
 │   ├── EvmHydrator (syncs wagmi state → store)
 │   └── EvmActions (registers EVM ChainActions)
 ├── SuiProvider (@mysten/dapp-kit — if chains.SUI)
 │   ├── SuiHydrator (syncs dapp-kit state → store)
 │   └── SuiActions (registers SUI ChainActions)
 ├── SolanaProvider (@solana/wallet-adapter — if chains.SOLANA)
 │   ├── SolanaHydrator (syncs wallet-adapter state → store)
 │   └── SolanaActions (registers SOLANA ChainActions)
 ├── useInitChainServices (creates services + registers non-provider ChainActions)
 └── useStacksHydration (Stacks network config)
```

### Bridge to wallet-sdk-core

`useWalletProvider(spokeChainId)` reads from `state.walletProviders[xChainType]` in the store. No chain-specific imports or switch-case — wallet providers are hydrated by Hydrators (provider chains) or created as side-effect of `setXConnection` (non-provider chains).

### Chain Implementations (`src/xchains/`)

| Chain | Service | Connectors | Native SDK |
|-------|---------|-----------|------------|
| EVM | `EvmXService` | `EvmXConnector` (wraps wagmi) | wagmi + EIP-6963 discovery |
| Solana | `SolanaXService` | `SolanaXConnector` | @solana/wallet-adapter-react |
| Sui | `SuiXService` | `SuiXConnector` | @mysten/dapp-kit |
| Stellar | `StellarXService` | `StellarWalletsKitXConnector` | @creit.tech/stellar-wallets-kit |
| Injective | `InjectiveXService` | `InjectiveXConnector` | @injectivelabs/wallet-* |
| ICON | `IconXService` | `IconHanaXConnector` | icon-sdk-js |
| Bitcoin | `BitcoinXService` | `UnisatXConnector`, `XverseXConnector`, `OKXXConnector` | sats-connect |
| NEAR | `NearXService` | `NearXConnector` | @hot-labs/near-connect |
| Stacks | `StacksXService` | `StacksXConnector` | @stacks/connect |

## Hooks (`src/hooks/`)

All hooks read from the Zustand store — no direct chain SDK hook usage:

- `useXConnect()` — connect to a wallet (reads `chainActions` from store)
- `useXDisconnect()` — disconnect wallet (reads `chainActions` from store)
- `useXAccount(chainIdentifier?)` — get connected account (address + chain type)
- `useXAccounts()` — get all connected accounts
- `useXConnectors(xChainType)` — get available connectors for a chain
- `useXConnection(xChainType)` — get active connection details
- `useXService(xChainType)` — get chain service instance
- `useXBalances({xChainId, xTokens, address})` — fetch token balances (refetches every 5s)
- `useWalletProvider(spokeChainId)` — get typed wallet provider from store
- `useEvmSwitchChain()` — EVM network switching
- `useXSignMessage()` — cross-chain message signing (reads `chainActions` from store)

## Directory Structure

```
src/
├── index.ts                    # Barrel export
├── SodaxWalletProvider.tsx     # Root provider (configurable)
├── useXWalletStore.ts          # Zustand store
├── useXWagmiStore.ts           # Deprecated alias for useXWalletStore
├── chainRegistry.ts            # Chain registry + createChainServices
├── core/                       # XService + XConnector abstract classes
├── hooks/                      # All hooks (store-first pattern)
├── providers/                  # Provider-managed chain components
│   ├── evm/                    # EvmProvider, EvmHydrator, EvmActions
│   ├── solana/                 # SolanaProvider, SolanaHydrator, SolanaActions
│   └── sui/                    # SuiProvider, SuiHydrator, SuiActions
├── context/                    # WalletConfigContext
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
├── types/                      # Type definitions (config, chainActions, interfaces)
└── utils/
```

## Adding a New Chain

1. Create `src/xchains/<chain>/` with `<Chain>XService.ts` and `<Chain>XConnector.ts`
2. XService must extend `XService` and implement `getBalance()` / `getBalances()`
3. XConnector must extend `XConnector` and implement `connect()` / `disconnect()`
4. Add entry to `chainRegistry` in `src/chainRegistry.ts`:
   - Set `providerManaged: false` for browser-extension chains
   - Provide `createActions` if the chain needs custom `signMessage` logic
   - Provide `createWalletProvider` if the chain needs a wallet provider
   - Provide `discoverConnectors` if connectors require async initialization
5. Add chain type to `ChainsConfig` in `src/types/config.ts`
6. If the chain needs a native SDK provider (`providerManaged: true`):
   - Create `src/providers/<chain>/` with Provider, Hydrator, Actions components
   - Mount conditionally in `SodaxWalletProvider.tsx`
7. Export from `src/xchains/<chain>/index.ts` and `src/index.ts`

## Build

tsup: dual ESM (`.mjs`) + CJS (`.cjs`). React, React DOM, and React Query are externalized.
