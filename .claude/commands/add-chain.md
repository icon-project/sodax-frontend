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
     /project:add-chain Aleo
     /project:add-chain Aptos
   ```
3. Derive naming conventions:
   - `CHAIN_TYPE` = uppercase (e.g., `ALEO`)
   - `ChainName` = PascalCase (e.g., `Aleo`)
   - `chainName` = camelCase (e.g., `aleo`)
   - `CHAIN_NAME_MAINNET_CHAIN_ID` = e.g., `ALEO_MAINNET_CHAIN_ID`

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
packages/sdk/src/shared/entities/near/      — SpokeProvider + RawSpokeProvider
packages/sdk/src/shared/services/spoke/NearSpokeService.ts
packages/sdk/src/shared/services/spoke/SpokeService.ts  — dispatch methods
packages/sdk/src/shared/utils/shared-utils.ts — constructRawSpokeProvider

packages/wallet-sdk-core/src/wallet-providers/NearWalletProvider.ts

packages/wallet-sdk-react/src/xchains/near/NearXService.ts
packages/wallet-sdk-react/src/xchains/near/NearXConnector.ts
packages/wallet-sdk-react/src/xchains/near/useNearXConnectors.ts
packages/wallet-sdk-react/src/xchains/near/index.ts
packages/wallet-sdk-react/src/useXWagmiStore.ts
packages/wallet-sdk-react/src/hooks/useXConnectors.ts
packages/wallet-sdk-react/src/hooks/useXConnect.ts
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
3. Add to `baseChainInfo` object
4. Add to `spokeChainConfig` object (addresses, tokens, RPC)
5. Add to intent relay chain ID mapping
6. Add to `hubAssets` if tokens bridge to hub
7. Add to `chainTokenListings`, `supportedChainTokens`, `swappableTokens`

#### 2d. Export types
**Modify** `packages/types/src/index.ts` — add export for new chain types

After Phase 1, ask user to verify types look correct before continuing.

---

### Step 3: Phase 2 — `packages/sdk` (spoke service + guards)

#### 3a. Create SpokeProvider
**Create** `packages/sdk/src/shared/entities/[chainName]/[ChainName]SpokeProvider.ts`:
- `[ChainName]SpokeProvider` class — holds walletProvider + chainConfig
- `[ChainName]RawSpokeProvider` class — read-only, `raw = true`
- Follow reference chain pattern exactly

**Create** `packages/sdk/src/shared/entities/[chainName]/index.ts` — barrel export

#### 3b. Create SpokeService
**Create** `packages/sdk/src/shared/services/spoke/[ChainName]SpokeService.ts`:
- Static-only class (private constructor)
- Methods: `deposit()`, `getDeposit()`, `getSimulateDepositParams()`, `callWallet()`
- Each method returns `Promise<TxReturnType<..., R>>` using the `raw` generic pattern
- Follow reference chain pattern exactly

#### 3c. Add type guards
**Modify** `packages/sdk/src/shared/guards.ts` — add 3-4 functions:
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
  - `estimateGas()` (if chain supports it — some chains skip this)

#### 3f. Add raw provider construction
**Modify** `packages/sdk/src/shared/utils/shared-utils.ts`:
- Add case in `constructRawSpokeProvider()` switch statement

#### 3g. Export
**Modify** `packages/sdk/src/shared/services/spoke/index.ts` — add export
**Modify** `packages/sdk/src/shared/entities/index.ts` — add export (if exists)

After Phase 2, run `cd packages/sdk && pnpm build` to verify compilation.

---

### Step 4: Phase 3 — `packages/wallet-sdk-core` (wallet provider)

#### 4a. Create WalletProvider
**Create** `packages/wallet-sdk-core/src/wallet-providers/[ChainName]WalletProvider.ts`:
- Implements `I[ChainName]WalletProvider` from types package
- Config type: `[ChainName]WalletConfig` (private key vs browser extension variants)
- Methods: `getWalletAddress()`, `signAndSubmitTxn()`, `getRawTransaction()`
- Follow reference chain pattern exactly

#### 4b. Export
**Modify** `packages/wallet-sdk-core/src/wallet-providers/index.ts` — add export

After Phase 3, run `cd packages/wallet-sdk-core && pnpm build` to verify.

---

### Step 5: Phase 4 — `packages/wallet-sdk-react` (React integration)

#### 5a. Create XService (singleton)
**Create** `packages/wallet-sdk-react/src/xchains/[chainName]/[ChainName]XService.ts`:
- Extends `XService` base class
- Singleton pattern via `getInstance()`
- Override `getBalance(address, xToken)` — chain-specific balance query
- Chain-specific properties (SDK client, connection, etc.)

#### 5b. Create XConnector
**Create** `packages/wallet-sdk-react/src/xchains/[chainName]/[ChainName]XConnector.ts`:
- Extends `XConnector` base class
- `connect()` — chain-specific wallet connection
- `disconnect()` — cleanup
- For chains using external SDK: stubs are OK (note with comment)

#### 5c. Create connector discovery hook (if needed)
**Create** `packages/wallet-sdk-react/src/xchains/[chainName]/use[ChainName]XConnectors.ts`:
- Returns available wallet connectors for this chain
- Uses `useQuery` to async discover installed wallets
- Only needed if chain has dynamic wallet discovery

#### 5d. Create barrel export
**Create** `packages/wallet-sdk-react/src/xchains/[chainName]/index.ts`:
```typescript
export { [ChainName]XService } from './[ChainName]XService';
export { [ChainName]XConnector } from './[ChainName]XConnector';
export { use[ChainName]XConnectors } from './use[ChainName]XConnectors';
```

#### 5e. Register in store
**Modify** `packages/wallet-sdk-react/src/useXWagmiStore.ts`:
- Import `[ChainName]XService`
- Add `'CHAIN_TYPE'` to the chain type loop array in `initXServices()`
- Add case in switch: instantiate singleton + set connectors

#### 5f. Add connector discovery
**Modify** `packages/wallet-sdk-react/src/hooks/useXConnectors.ts`:
- Import `use[ChainName]XConnectors` hook
- Call hook at top of component
- Add `case 'CHAIN_TYPE': return [chainName]XConnectors || [];`

#### 5g. Add connect logic (if needed)
**Modify** `packages/wallet-sdk-react/src/hooks/useXConnect.ts`:
- If chain needs special connect logic, add case in switch
- Most chains fall through to `default` which calls `xConnector.connect()`

#### 5h. Export
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
- [ ] ChainType includes new chain
- [ ] spokeChainConfig has full config
- [ ] Type guards created (3-4 functions)
- [ ] SpokeService dispatches to new chain in all methods
- [ ] constructRawSpokeProvider handles new chain
- [ ] WalletProvider implements interface
- [ ] XService singleton with getBalance
- [ ] XConnector with connect/disconnect
- [ ] useXWagmiStore initializes service
- [ ] useXConnectors returns connectors
- [ ] All barrel exports updated

---

### Step 7: Summary

Print a summary of all files created and modified:

```
Chain [ChainName] scaffolded!

Created (X files):
  packages/types/src/[chainName]/index.ts
  packages/sdk/src/shared/entities/[chainName]/[ChainName]SpokeProvider.ts
  packages/sdk/src/shared/services/spoke/[ChainName]SpokeService.ts
  packages/wallet-sdk-core/src/wallet-providers/[ChainName]WalletProvider.ts
  packages/wallet-sdk-react/src/xchains/[chainName]/[ChainName]XService.ts
  packages/wallet-sdk-react/src/xchains/[chainName]/[ChainName]XConnector.ts
  packages/wallet-sdk-react/src/xchains/[chainName]/use[ChainName]XConnectors.ts
  packages/wallet-sdk-react/src/xchains/[chainName]/index.ts

Modified (X files):
  packages/types/src/common/index.ts          — ChainTypeArr
  packages/types/src/constants/index.ts       — chain config (6 sections)
  packages/types/src/index.ts                 — export
  packages/sdk/src/shared/guards.ts           — type guards
  packages/sdk/src/shared/types.ts            — union types
  packages/sdk/src/shared/services/spoke/SpokeService.ts — dispatch (5 methods)
  packages/sdk/src/shared/utils/shared-utils.ts — constructRawSpokeProvider
  packages/wallet-sdk-core/src/wallet-providers/index.ts — export
  packages/wallet-sdk-react/src/useXWagmiStore.ts — initXServices
  packages/wallet-sdk-react/src/hooks/useXConnectors.ts — connector case
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
- If chain has unusual architecture (e.g., UTXO like Bitcoin, account-based like Aleo), note deviations from standard pattern
- Follow `packages/sdk/CLAUDE.md` and `packages/wallet-sdk-react/CLAUDE.md` for conventions
