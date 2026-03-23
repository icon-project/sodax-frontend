# Add New Chain

Scaffold all files needed to integrate a new blockchain into the Sodax monorepo.

**Chain name: $ARGUMENTS**

## Instructions

You are adding a new spoke chain to sodax-frontend. This touches 4 packages in dependency order. Follow each phase precisely. Use existing chain implementations (NEAR, Solana, or EVM) as reference — read them before writing.

### Step 0: Parse input and validate

1. Parse chain name from: `$ARGUMENTS`
2. If empty, print usage and STOP:
   ```
   Usage: /project:add-chain <ChainName>
   Examples:
     /project:add-chain Solana
     /project:add-chain Sui
   ```
3. Derive naming conventions:
   - `CHAIN_TYPE` = uppercase (e.g., `SOLANA`)
   - `ChainName` = PascalCase (e.g., `Solana`)
   - `chainName` = camelCase (e.g., `solana`)
   - `CHAIN_NAME_MAINNET_CHAIN_ID` = e.g., `SOLANA_MAINNET_CHAIN_ID`

4. Ask the user:
   - Chain ID value (number or string)?
   - RPC URL?
   - Native token symbol and decimals?
   - Is this EVM-compatible? (determines base pattern to follow)
   - Which existing chain is closest in architecture? (for reference implementation)

---

### Step 1: Study reference implementation

Read the reference chain's implementation across all 4 packages to understand the exact pattern. For example, if user says "closest to NEAR":

```
packages/types/src/constants/index.ts       — chain ID, baseChainInfo, spokeChainConfig, relay mapping, token listings
packages/types/src/common/index.ts          — ChainTypeArr
packages/types/src/near/index.ts            — chain-specific types

packages/sdk/src/shared/guards.ts           — type guard functions
packages/sdk/src/shared/types.ts            — provider type definitions
packages/sdk/src/shared/entities/near/      — SpokeProvider + RawSpokeProvider + utils (if any)
packages/sdk/src/shared/services/spoke/NearSpokeService.ts
packages/sdk/src/shared/services/spoke/SpokeService.ts  — dispatch methods
packages/sdk/src/shared/utils/shared-utils.ts — constructRawSpokeProvider + encodeAddress

packages/wallet-sdk-core/src/wallet-providers/NearWalletProvider.ts

packages/wallet-sdk-react/src/xchains/near/NearXService.ts
packages/wallet-sdk-react/src/xchains/near/NearXConnector.ts
packages/wallet-sdk-react/src/xchains/near/index.ts
packages/wallet-sdk-react/src/useXWagmiStore.ts
packages/wallet-sdk-react/src/hooks/useXConnectors.ts
packages/wallet-sdk-react/src/hooks/useXConnect.ts
packages/wallet-sdk-react/src/hooks/useXConnection.ts
packages/wallet-sdk-react/src/hooks/useXDisconnect.ts
packages/wallet-sdk-react/src/hooks/useWalletProvider.ts
packages/wallet-sdk-react/src/Hydrate.ts
packages/wallet-sdk-react/src/SodaxWalletProvider.tsx
packages/wallet-sdk-react/src/index.ts
```

Read ALL of these files for the reference chain before writing any code.

---

### Step 2: Phase 1 — `packages/types` (type definitions)

Create and modify files in this order:

#### 2a. Create chain-specific types file
**Create** `packages/types/src/[chainName]/index.ts`:
- Chain-specific interfaces: wallet provider interface (`I[ChainName]WalletProvider`), raw transaction type, transfer args
- Follow the reference chain's type file exactly

#### 2b. Add ChainType
**Modify** `packages/types/src/common/index.ts`:
- Add `'CHAIN_TYPE'` to `ChainTypeArr`

#### 2c. Add chain config
**Modify** `packages/types/src/constants/index.ts` — add these sections (search for the reference chain to find exact locations):
1. Chain ID constant: `export const CHAIN_NAME_MAINNET_CHAIN_ID = '...';`
2. Add to `CHAIN_IDS` array
3. Add to `EVM_CHAIN_IDS` array (only if EVM-compatible)
4. Add to `baseChainInfo` object (name, id, type, chainId)
5. Add to `spokeChainConfig` object (addresses, tokens, RPC, nativeToken, bnUSD, supportedTokens)
6. Add to `ChainIdToIntentRelayChainId` mapping (relay chain ID as bigint)
7. Add vault token to `HubVaultSymbols` and `SodaTokens` (if native token bridges to hub)
8. Add to `hubAssets` (maps spoke token addresses to hub vault info)
9. Add to `swapSupportedTokens` (tokens available for swap)
10. Add to `moneyMarketSupportedTokens` (tokens available for money market)

Note: `defaultSodaxConfig` at the bottom auto-includes `spokeChainConfig`, `hubAssets`, `swapSupportedTokens`, etc. — no manual edit needed there if keys match.

#### 2d. Export types
**Modify** `packages/types/src/index.ts` — add `export * from './[chainName]/index.js';`

After Phase 1, ask user to verify types look correct before continuing.

---

### Step 3: Phase 2 — `packages/sdk` (spoke service + guards)

#### 3a. Create SpokeProvider
**Create** `packages/sdk/src/shared/entities/[chainName]/[ChainName]SpokeProvider.ts`:
- `[ChainName]SpokeProvider` class — holds walletProvider + chainConfig
- `[ChainName]RawSpokeProvider` class — read-only, `raw = true` as const
- `[ChainName]RawSpokeProviderConfig` type — config shape for raw provider construction
- Follow reference chain pattern exactly

**Create** `packages/sdk/src/shared/entities/[chainName]/index.ts` — barrel export

If chain needs helpers (PDAs, address utils, contract configs), create:
- `packages/sdk/src/shared/entities/[chainName]/utils/` — chain-specific utilities
- `packages/sdk/src/shared/entities/[chainName]/Configs.ts` — contract program setup (if applicable)

#### 3b. Create SpokeService
**Create** `packages/sdk/src/shared/services/spoke/[ChainName]SpokeService.ts`:
- Static-only class (private constructor)
- Required public methods:
  - `deposit()` — transfer tokens to hub via AssetManager
  - `getDeposit()` — query deposited balance
  - `getSimulateDepositParams()` — return simulation parameters
  - `callWallet()` — send message to hub via Connection contract
  - `waitForConfirmation()` — poll tx status until confirmed (provider-based)
  - `waitForConfirmationRaw()` — poll tx status (RPC-based, no provider needed)
- Optional: `estimateGas()` — simulate tx to estimate gas (not all chains support this)
- Each method returns `Promise<TxReturnType<..., R>>` using the `raw` generic pattern
- Follow reference chain pattern exactly

#### 3c. Add type guards
**Modify** `packages/sdk/src/shared/guards.ts` — add 4 functions:
- `is[ChainName]SpokeProvider(value)` — checks instanceof + chain type
- `is[ChainName]SpokeProviderType(value)` — checks provider OR raw provider
- `is[ChainName]RawSpokeProvider(value)` — checks raw + chain type
- `is[ChainName]RawSpokeProviderConfig(value)` — checks config shape

#### 3d. Add provider types
**Modify** `packages/sdk/src/shared/types.ts`:
- Import new provider types
- Add to union types: `SpokeProviderType`, `RawSpokeProvider`, `SpokeDepositParams`, etc.
- Add to conditional type mappings: `GetSpokeDepositParamsType`, `TxReturnType`, etc.

#### 3e. Add dispatch cases
**Modify** `packages/sdk/src/shared/services/spoke/SpokeService.ts`:
- Add import for `[ChainName]SpokeService` and type guard
- Add `if (is[ChainName]SpokeProviderType(spokeProvider))` case in EACH dispatch method:
  - `deposit()`
  - `getSimulateDepositParams()`
  - `getDeposit()`
  - `callWallet()`
  - `estimateGas()` (if chain supports it)
  - `verifyTxHash()` — call `[ChainName]SpokeService.waitForConfirmation()`
  - `verifyTxHashRaw()` — add case in switch for `'CHAIN_TYPE'`

#### 3f. Add raw provider construction and address encoding
**Modify** `packages/sdk/src/shared/utils/shared-utils.ts`:
- Add case in `constructRawSpokeProvider()` switch statement
- Add case in `encodeAddress()` for the new chain's address format

#### 3g. Export
**Modify** `packages/sdk/src/shared/services/spoke/index.ts` — add export
**Modify** `packages/sdk/src/shared/entities/index.ts` — add export

After Phase 2, run `cd packages/sdk && pnpm build` to verify compilation.

---

### Step 4: Phase 3 — `packages/wallet-sdk-core` (wallet provider)

#### 4a. Create WalletProvider
**Create** `packages/wallet-sdk-core/src/wallet-providers/[ChainName]WalletProvider.ts`:
- Implements `I[ChainName]WalletProvider` from `@sodax/types`
- Config type: `[ChainName]WalletConfig` — union of variants (e.g., private key mode vs browser extension mode)
- Methods: implement all methods defined in `I[ChainName]WalletProvider` interface
  - At minimum: `getWalletAddress()` + chain-specific signing/sending methods
  - Method names vary per chain — follow the interface from types package exactly
- Follow reference chain pattern exactly

#### 4b. Export
**Modify** `packages/wallet-sdk-core/src/wallet-providers/index.ts` — add export

After Phase 3, run `cd packages/wallet-sdk-core && pnpm build` to verify.

---

### Step 5: Phase 4 — `packages/wallet-sdk-react` (React integration)

#### 5a. Create XService (singleton)
**Create** `packages/wallet-sdk-react/src/xchains/[chainName]/[ChainName]XService.ts`:
- Extends `XService` base class
- Singleton pattern: `private static instance`, `static getInstance()`
- Constructor: `private constructor()` calls `super('CHAIN_TYPE')`
- Override `getBalance(address, xToken)` — chain-specific balance query
- Chain-specific public properties for hydration (e.g., `connection`, `wallet`, `client`)

#### 5b. Create XConnector
**Create** `packages/wallet-sdk-react/src/xchains/[chainName]/[ChainName]XConnector.ts`:
- Extends `XConnector` base class
- Constructor: accepts wallet adapter/provider, calls `super('CHAIN_TYPE', name, id)`
- `connect()` — chain-specific wallet connection (can be stub if handled by external adapter)
- `disconnect()` — cleanup (can be no-op if handled by external adapter)
- Override `icon` getter if wallet provides icon

#### 5c. Create barrel export
**Create** `packages/wallet-sdk-react/src/xchains/[chainName]/index.ts`:
```typescript
export { [ChainName]XService } from './[ChainName]XService';
export { [ChainName]XConnector } from './[ChainName]XConnector';
```

#### 5d. Register in store
**Modify** `packages/wallet-sdk-react/src/useXWagmiStore.ts`:
- Import `[ChainName]XService`
- Add case in `initXServices()` switch: `case 'CHAIN_TYPE': xServices[xChainType] = [ChainName]XService.getInstance(); break;`

#### 5e. Add connector discovery
**Modify** `packages/wallet-sdk-react/src/hooks/useXConnectors.ts`:
- Import `[ChainName]XConnector`
- If chain uses an external wallet adapter (e.g., `@solana/wallet-adapter-react`): call its hook at the top of the component
- Add `case 'CHAIN_TYPE':` — return array of `[ChainName]XConnector` instances from discovered wallets
- Note: some chains have inline discovery here instead of a separate `use[ChainName]XConnectors` hook

#### 5f. Add connect logic
**Modify** `packages/wallet-sdk-react/src/hooks/useXConnect.ts`:
- Add `case 'CHAIN_TYPE':` in the switch
- Call chain-specific connect flow (e.g., `select(walletName)` + `connect()` for adapter-based chains)
- Handle special wallets if needed (e.g., MetaMask on Solana has timeout handling)

#### 5g. Add connection state
**Modify** `packages/wallet-sdk-react/src/hooks/useXConnection.ts`:
- Add `case 'CHAIN_TYPE':` — return `{ xAccount: { address, xChainType }, xConnectorId }` when wallet is connected
- Read connection state from chain-specific wallet hook

#### 5h. Add disconnect logic
**Modify** `packages/wallet-sdk-react/src/hooks/useXDisconnect.ts`:
- Add `case 'CHAIN_TYPE':` — call chain-specific disconnect (e.g., `wallet.disconnect()`)

#### 5i. Add wallet provider factory
**Modify** `packages/wallet-sdk-react/src/hooks/useWalletProvider.ts`:
- Import `[ChainName]WalletProvider` from `@sodax/wallet-sdk-core`
- Add `case 'CHAIN_TYPE':` — instantiate `[ChainName]WalletProvider` with config from XService singleton
- Validate required properties (connection, wallet) before constructing — return `undefined` if missing

#### 5j. Add hydration
**Modify** `packages/wallet-sdk-react/src/Hydrate.ts`:
- Import chain-specific hooks (e.g., `useConnection()`, `useWallet()` from adapter library)
- Add `useEffect` blocks to hydrate `[ChainName]XService.getInstance()` properties when adapter state changes

#### 5k. Add provider wrapper
**Modify** `packages/wallet-sdk-react/src/SodaxWalletProvider.tsx`:
- Import chain-specific provider components (e.g., `ConnectionProvider`, `WalletProvider` from adapter library)
- Wrap children with chain provider, using RPC URL from `rpcConfig['chainName']`

#### 5l. Export
**Modify** `packages/wallet-sdk-react/src/index.ts`:
- Add `export * from './xchains/[chainName]';`

After Phase 4, run `pnpm build:packages` to verify full build.

---

### Step 6: Verification checklist

Run these checks and report results:

```bash
pnpm build:packages          # All packages build
pnpm checkTs                  # No type errors
pnpm lint                     # No lint errors
```

Then verify completeness:
- [ ] Chain ID constant exported from `@sodax/types`
- [ ] ChainType includes new chain in `ChainTypeArr`
- [ ] `baseChainInfo` has entry
- [ ] `spokeChainConfig` has full config
- [ ] `ChainIdToIntentRelayChainId` has relay mapping
- [ ] `swapSupportedTokens` and `moneyMarketSupportedTokens` have entries
- [ ] `hubAssets` has token mappings
- [ ] Type guards created (4 functions)
- [ ] SpokeService dispatches to new chain in all 7 methods
- [ ] `constructRawSpokeProvider` handles new chain
- [ ] `encodeAddress` handles new chain
- [ ] WalletProvider implements interface from types
- [ ] XService singleton with getBalance
- [ ] XConnector with connect/disconnect
- [ ] `useXWagmiStore` initializes service
- [ ] `useXConnectors` returns connectors
- [ ] `useXConnect` handles connect flow
- [ ] `useXConnection` returns connection state
- [ ] `useXDisconnect` handles disconnect
- [ ] `useWalletProvider` creates provider instance
- [ ] `Hydrate.ts` hydrates XService properties
- [ ] `SodaxWalletProvider.tsx` wraps with chain provider
- [ ] All barrel exports updated

---

### Step 7: Summary

Print a summary of all files created and modified:

```
Chain [ChainName] scaffolded!

Created (X files):
  packages/types/src/[chainName]/index.ts
  packages/sdk/src/shared/entities/[chainName]/[ChainName]SpokeProvider.ts
  packages/sdk/src/shared/entities/[chainName]/index.ts
  packages/sdk/src/shared/services/spoke/[ChainName]SpokeService.ts
  packages/wallet-sdk-core/src/wallet-providers/[ChainName]WalletProvider.ts
  packages/wallet-sdk-react/src/xchains/[chainName]/[ChainName]XService.ts
  packages/wallet-sdk-react/src/xchains/[chainName]/[ChainName]XConnector.ts
  packages/wallet-sdk-react/src/xchains/[chainName]/index.ts

Modified (X files):
  packages/types/src/common/index.ts          — ChainTypeArr
  packages/types/src/constants/index.ts       — chain config (10 sections)
  packages/types/src/index.ts                 — export
  packages/sdk/src/shared/guards.ts           — type guards (4 functions)
  packages/sdk/src/shared/types.ts            — union types + conditional types
  packages/sdk/src/shared/services/spoke/SpokeService.ts — dispatch (7 methods)
  packages/sdk/src/shared/utils/shared-utils.ts — constructRawSpokeProvider + encodeAddress
  packages/sdk/src/shared/services/spoke/index.ts — export
  packages/sdk/src/shared/entities/index.ts   — export
  packages/wallet-sdk-core/src/wallet-providers/index.ts — export
  packages/wallet-sdk-react/src/useXWagmiStore.ts — initXServices
  packages/wallet-sdk-react/src/hooks/useXConnectors.ts — connector discovery
  packages/wallet-sdk-react/src/hooks/useXConnect.ts — connect flow
  packages/wallet-sdk-react/src/hooks/useXConnection.ts — connection state
  packages/wallet-sdk-react/src/hooks/useXDisconnect.ts — disconnect
  packages/wallet-sdk-react/src/hooks/useWalletProvider.ts — provider factory
  packages/wallet-sdk-react/src/Hydrate.ts    — service hydration
  packages/wallet-sdk-react/src/SodaxWalletProvider.tsx — provider wrapper
  packages/wallet-sdk-react/src/index.ts      — export

Next steps:
  1. Fill in contract addresses when available
  2. Add chain to apps/web UI (route tabs, token selectors)
  3. Add E2E tests in apps/node/
  4. Test with real wallet connection
```

---

## Important notes

- Always read the reference chain implementation before writing — do not guess patterns
- Build after each phase to catch errors early
- Ask user for contract addresses, RPC URLs, token info — do not use placeholders silently
- This command works best for **account-based chains** (EVM, Solana, SUI, NEAR, Stellar). For UTXO chains (Bitcoin) or chains with non-standard auth/signing (Injective cosmos-style, Stacks Clarity), significant custom work is needed beyond this scaffold — use this as a starting skeleton only
- Follow `packages/sdk/CLAUDE.md` and `packages/wallet-sdk-react/CLAUDE.md` for conventions
