# apps/web — Next.js Web App

## Mini Map

```
app/
├── (apps)/                          # Feature routes (shared layout)
│   ├── swap/                        # Token swap
│   ├── save/                        # Money market deposit/savings
│   ├── loans/                       # Lending/borrowing
│   ├── stake/                       # SODA staking
│   ├── migrate/                     # Token migration (ICX→SODA, bnUSD, BALN)
│   ├── pool/                        # Liquidity pools
│   └── partner-dashboard/           # Partner fee management
├── api/                             # Next.js API routes
├── cms/                             # CMS pages (TipTap + Notion)
├── community/ news/ glossary/       # Content pages
│   press/ partners/ concepts/
├── system/                          # System routes
└── layout.tsx                       # Root layout

components/
├── ui/                              # shadcn/ui (Radix) — Button, Dialog, etc.
├── shared/                          # Reusable cross-feature components
│   ├── connect-wallet-button.tsx    # Wallet connection
│   ├── currency-logo.tsx            # Token icon
│   ├── network-icon.tsx             # Chain icon
│   ├── token-asset.tsx              # Token + balance display
│   ├── route-tabs.tsx               # Feature navigation tabs
│   ├── wallet-modal/                # Wallet selection modal
│   └── ...                          # ~27 shared components
├── landing/                         # Landing page components
├── icons/                           # Icon components
└── cms/ news/ glossary/ partners/   # Content-specific components

hooks/                               # App-level hooks (flat, no subdirs)
├── useAllChainBalances.ts           # Multi-chain balance aggregation
├── useAllTokenPrices.ts             # Token price data
├── useTokenPrice.ts                 # Single token price
├── useReserveMetrics.ts             # Money market metrics
├── useAPY.ts                        # APY calculations
├── useSupportedTokens.ts            # Supported token list
├── useChainItem.ts                  # Chain metadata
├── useBreakPoint.ts                 # Responsive breakpoints
└── ...

stores/                              # Global Zustand stores
├── app-store.tsx                    # primaryChainType, isSwitchingPage, animation
├── app-store-provider.tsx           # Provider + useAppState/useAppActions
├── modal-store.tsx                  # Global modal state
└── modal-store-provider.tsx         # Provider + useModalState/useModalActions

providers/providers.tsx               # Provider stack: Sodax → QueryClient → Wallet
constants/animation.ts                # listVariants, itemVariants for page transitions
```

## Feature Folder Structure

Every feature under `app/(apps)/[feature]/` follows this structure:

```
[feature]/
├── page.tsx                         # Main page ('use client')
├── _stores/
│   ├── [feature]-store.ts           # Zustand vanilla store
│   └── [feature]-store-provider.tsx  # Context provider + hooks
├── _components/
│   ├── [name]-dialog.tsx            # Modal/dialog components
│   ├── [name]-panel.tsx             # Panel/section components
│   ├── [name]-button.tsx            # Action buttons
│   └── [subfolder]/                 # Complex UI groups
└── _constants/                      # Optional feature constants
    └── [feature]-messages.ts
```

## Zustand Store Convention

### Store file (`_stores/[feature]-store.ts`)

```typescript
import { createStore } from 'zustand/vanilla';

export type FeatureState = { /* state fields */ };
export type FeatureActions = { /* setters + reset */ };
export type FeatureStore = FeatureState & FeatureActions;

export const defaultFeatureState: FeatureState = { /* defaults */ };

export const createFeatureStore = (initState: FeatureState = defaultFeatureState) => {
  return createStore<FeatureStore>()((set, get) => ({
    ...initState,
    setField: (value) => set({ field: value }),
    reset: () => set(defaultFeatureState),
  }));
};
```

Key rules:
- Always use `zustand/vanilla` (not `zustand`)
- Export types: `FeatureState`, `FeatureActions`, `FeatureStore`
- Export default state and factory function
- Use `persist` middleware only when state should survive page reload (e.g., swap store)

### Provider file (`_stores/[feature]-store-provider.tsx`)

```typescript
'use client';
import { type ReactNode, createContext, useRef, useContext } from 'react';
import { useStore } from 'zustand';

// createContext → useRef (create once) → Provider
// Export: useFeatureStore(selector), useFeatureState(), useFeatureActions()
```

Key rules:
- Store created once via `useRef` null check pattern
- Always export 3 hooks: `useFeatureStore`, `useFeatureState`, `useFeatureActions`
- Throw error if used outside provider

## Page Component Convention

```typescript
'use client';

// 1. React imports
// 2. Feature store hooks (useFeatureState, useFeatureActions)
// 3. Wallet hooks (@sodax/wallet-sdk-react: useXAccount, useXBalances)
// 4. dapp-kit hooks (@sodax/dapp-kit: useQuote, useSodaxContext)
// 5. App hooks (@/hooks/useTokenPrice, useAllChainBalances)
// 6. Types (@sodax/types)
// 7. SDK constants (@sodax/sdk)
// 8. UI components (@/components/ui/*)
// 9. Feature components (./_components/*)
// 10. Shared components (@/components/shared/*)
// 11. Animation constants (@/constants/animation)
// 12. Utils (viem, bignumber.js)

export default function FeaturePage() {
  // Store state & actions
  // Local UI state (useState)
  // Wallet hooks
  // dapp-kit hooks
  // Derived state (useMemo)
  // Side effects (useEffect)
  // Entrance animation: useEffect(() => { setTimeout(() => setIsOpen(true), 500) }, [])
  // Cleanup on unmount: useEffect(() => () => { reset() }, [reset])

  return (
    <motion.div variants={listVariants} initial={false} animate={isOpen ? 'open' : 'closed'}>
      <motion.div variants={itemVariants}>
        {/* Feature components */}
      </motion.div>
    </motion.div>
  );
}
```

## State Management Hierarchy

1. **Global app store** (`stores/app-store`) — chain type, page switching
2. **Feature stores** (`_stores/`) — feature-specific UI state (per-page)
3. **React Query** (`@sodax/dapp-kit` hooks) — server state (quotes, balances, reserves)
4. **Local useState** — component-level UI (dialogs, animations)

## Component Naming

- Feature components: kebab-case files, PascalCase exports
- Suffix indicates purpose: `-dialog`, `-panel`, `-button`, `-list`, `-selector`, `-header`, `-carousel`
- Shared components: `components/shared/` — reusable across features
- UI primitives: `components/ui/` — shadcn/ui only, do not modify directly

## Adding a New Feature

1. Create `app/(apps)/[feature]/page.tsx` with `'use client'`
2. Create `_stores/[feature]-store.ts` + `[feature]-store-provider.tsx`
3. Create `_components/` with feature-specific components
4. Wrap page with `FeatureStoreProvider` in `page.tsx` or layout
5. Add route tab in `components/shared/route-tabs.tsx` if needed
6. Use `motion.div` with `listVariants`/`itemVariants` for page entrance animation
7. Always reset store on unmount: `useEffect(() => () => { reset() }, [reset])`
