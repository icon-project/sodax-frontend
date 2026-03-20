# packages/wallet-sdk-react — Multi-Chain Wallet Abstraction

## Mini Map

```
src/
├── core/
│   ├── XService.ts                  # ⭐ Base class: getBalance, getBalances, connectors
│   └── XConnector.ts                # ⭐ Base class: connect, disconnect, id, icon
├── xchains/                         # Per-chain implementations
│   ├── evm/
│   │   ├── EvmXService.ts           # Wagmi-based, multicall balances, 12 EVM chains
│   │   └── EvmXConnector.ts         # Wraps Wagmi Connector
│   ├── solana/
│   │   ├── SolanaXService.ts        # @solana/web3.js, SPL token balances
│   │   └── SolanaXConnector.ts      # Wraps wallet-adapter
│   ├── sui/
│   │   ├── SuiXService.ts           # Sui client, coin balances
│   │   └── SuiXConnector.ts         # Wraps dapp-kit wallet
│   ├── stellar/
│   │   ├── StellarXService.ts       # XLM + Soroban token balances
│   │   ├── StellarWalletsKitXConnector.ts
│   │   ├── CustomSorobanServer.ts
│   │   └── useStellarXConnectors.ts
│   ├── icon/
│   │   ├── IconXService.ts          # ICX + IRC2 balances via multicall
│   │   └── IconXConnector.ts
│   ├── injective/
│   │   ├── InjectiveXService.ts     # Portfolio API balances
│   │   ├── InjectiveXConnector.ts
│   │   └── InjectiveMetamaskXConnector.ts
│   ├── near/
│   │   ├── NearXService.ts          # JSON-RPC balance queries
│   │   ├── NearXConnector.ts
│   │   └── useNearXConnectors.ts
│   ├── bitcoin/
│   │   ├── BitcoinXService.ts       # Mempool API, UTXO-based balance
│   │   ├── BitcoinXConnector.ts     # Abstract base for BTC wallets
│   │   ├── UnisatXConnector.ts
│   │   ├── XverseXConnector.ts
│   │   ├── OKXXConnector.ts
│   │   └── useBitcoinXConnectors.ts
│   └── stacks/
│       ├── StacksXService.ts        # STX + SIP-010 balances
│       ├── StacksXConnector.ts
│       └── useStacksXConnectors.ts
├── hooks/                           # React hooks for wallet interaction
│   ├── useXAccount.ts               # Get connected account for a chain
│   ├── useXAccounts.ts              # Get all accounts across all chains
│   ├── useXConnect.ts               # Connect wallet (mutation)
│   ├── useXDisconnect.ts            # Disconnect wallet
│   ├── useXConnectors.ts            # Get available connectors for a chain
│   ├── useXConnection.ts            # Get connection state
│   ├── useXBalance.ts               # Single token balance (React Query)
│   ├── useXService.ts               # Get XService instance from store
│   ├── useWalletProvider.ts         # Get wallet provider for SDK
│   ├── useEthereumChainId.ts        # Current EVM chain ID
│   ├── useEvmSwitchChain.ts         # Switch EVM network
│   └── useXSignMessage.ts           # Sign message with wallet
├── actions/
│   ├── getXService.ts               # Get service by chain type
│   └── getXChainType.ts             # Resolve ChainId → ChainType
├── types/
│   └── index.ts                     # XAccount, XConnection, WalletId
├── useXWagmiStore.ts                # ⭐ Zustand store (services + connections)
├── SodaxWalletProvider.tsx           # Root provider (wraps all chain SDKs)
└── index.ts                         # Public exports
```

## XService Pattern (Base)

```typescript
abstract class XService {
  xChainType: ChainType;
  private xConnectors: XConnector[];

  getBalance(address: string, xToken: XToken): Promise<bigint>;    // Override per chain
  getBalances(address: string, xTokens: XToken[]): Promise<Record<string, bigint>>;  // Calls getBalance in parallel
  getXConnectors(): XConnector[];
  setXConnectors(connectors: XConnector[]): void;
  getXConnectorById(id: string): XConnector | undefined;
}
```

All chain services are **singletons** via `getInstance()`.

## XConnector Pattern (Base)

```typescript
abstract class XConnector {
  xChainType: ChainType;
  name: string;
  get id(): string;
  get icon(): string | undefined;

  abstract connect(): Promise<XAccount | undefined>;
  abstract disconnect(): Promise<void>;
}
```

For chains using external SDKs (EVM, SUI, Solana), connect/disconnect are stubs — handled by native hooks.

## Chain-Specific Implementation

```typescript
// Singleton service
export class EvmXService extends XService {
  private static instance: EvmXService;
  wagmiConfig: Config;  // Chain-specific property

  static getInstance(): EvmXService { /* lazy init */ }

  async getBalance(address, xToken): Promise<bigint> {
    // Use viem/wagmi for EVM balance queries
  }

  async getBalances(address, xTokens): Promise<Record<string, bigint>> {
    // Use multicall for efficiency
  }
}

// Connector wrapping external SDK
export class EvmXConnector extends XConnector {
  connector: Connector;  // Wagmi connector

  connect() { /* stub — wagmi handles */ }
  disconnect() { /* stub — wagmi handles */ }
}
```

## Zustand Store (useXWagmiStore)

```typescript
type XWagmiStore = {
  xServices: Partial<Record<ChainType, XService>>;       // Service instances
  xConnections: Partial<Record<ChainType, XConnection>>;  // Connected wallets
  setXConnection: (chainType, connection) => void;
  unsetXConnection: (chainType) => void;
};
```

- Uses `persist` middleware (only `xConnections` persisted to localStorage)
- Uses `immer` for state updates
- `initXServices()` creates all chain service singletons on app init

## Connector Discovery

Connectors come from different sources per chain:

| Chain | Source |
|-------|--------|
| EVM | Wagmi `useConnectors()` |
| Solana | wallet-adapter `useWallet()` (filtered to installed) |
| SUI | dapp-kit `useWallets()` |
| Stellar | `useStellarXConnectors()` custom hook |
| NEAR | `useNearXConnectors()` custom hook |
| Bitcoin | `useBitcoinXConnectors()` custom hook |
| Stacks | `useStacksXConnectors()` custom hook |
| Injective, ICON | Pre-instantiated in store |

## Adding a New Chain

### 1. wallet-sdk-core
- Create `wallet-providers/[Chain]WalletProvider.ts`
- Export from `index.ts`

### 2. wallet-sdk-react
- Create `xchains/[chain]/[Chain]XService.ts` — extend `XService`, implement `getBalance()`
- Create `xchains/[chain]/[Chain]XConnector.ts` — extend `XConnector`
- If custom wallet discovery: create `xchains/[chain]/use[Chain]XConnectors.ts`
- Add to `initXServices()` in `useXWagmiStore.ts`
- Add dispatch case in `useXConnect.ts` (chain-specific connect logic)
- Add dispatch case in `useXConnection.ts` (chain-specific connection query)
- Add dispatch case in `useXConnectors.ts` (connector source)
- Export from `xchains/[chain]/index.ts` and root `index.ts`

### 3. packages/types
- Add `ChainType` variant
- Add `ChainId` for the new chain
- Add chain config

### 4. packages/sdk
- Create spoke service (see `packages/sdk/CLAUDE.md`)
- Add type guard in `guards.ts`
- Add dispatch in `SpokeService.ts`

## Type Definitions

```typescript
type XAccount = {
  address: string | undefined;
  xChainType: ChainType | undefined;
  publicKey?: string;  // Optional (Solana, Bitcoin)
};

type XConnection = {
  xAccount: XAccount;
  xConnectorId: string;
};
```
