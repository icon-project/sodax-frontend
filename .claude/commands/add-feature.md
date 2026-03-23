# Add New Feature

Scaffold a new feature page in the web app with store, provider, components, and route.

**Feature name: $ARGUMENTS**

## Instructions

You are adding a new feature page to `apps/web`. Follow the exact conventions from existing features (stake, save, swap). Read them before writing.

### Step 0: Parse input and validate

1. Parse feature name from: `$ARGUMENTS`
2. If empty, print usage and STOP:
   ```
   Usage: /project:add-feature <featureName>
   Examples:
     /project:add-feature lending
     /project:add-feature rewards
   ```
3. Derive naming conventions:
   - `feature` = kebab-case for files/routes (e.g., `lending`)
   - `Feature` = PascalCase for types/components (e.g., `Lending`)
   - `FEATURE` = UPPER_CASE for constants (e.g., `LENDING`)
   - Route path = `/feature` (e.g., `/lending`)

4. Ask the user:
   - Brief description of what this feature does?
   - Which existing feature is closest? (swap, save, stake, pool — for reference)
   - Does it need a multi-step flow? (like save's deposit steps or stake's staking/unstaking modes)
   - Does it interact with SDK? If yes, which module? (swap, moneyMarket, staking, bridge, dex)

---

### Step 1: Study reference feature

Read the reference feature's implementation to understand the exact pattern:

```
apps/web/app/(apps)/[reference]/page.tsx
apps/web/app/(apps)/[reference]/_stores/[reference]-store.ts
apps/web/app/(apps)/[reference]/_stores/[reference]-store-provider.tsx
apps/web/app/(apps)/[reference]/_components/   (list all files)
apps/web/app/(apps)/layout.tsx                 (provider nesting)
apps/web/components/shared/route-tabs.tsx       (tab config — includes `enabled` flag)
apps/web/components/shared/tab-icon.tsx         (icon types for tabs)
apps/web/constants/routes.ts                   (route constants)
apps/web/constants/animation.ts                (animation variants)
```

Read ALL of these before writing any code.

---

### Step 2: Create store

#### 2a. Store definition
**Create** `apps/web/app/(apps)/[feature]/_stores/[feature]-store.ts`:

```typescript
import { createStore } from 'zustand/vanilla';

// Enums for modes/steps (if multi-step flow)
// export enum FEATURE_STEP { ... }
// export enum FEATURE_MODE { ... }

export type FeatureState = {
  // UI state fields based on user's description
  // Always include basic fields:
  // typedValue: string;           — for amount inputs
  // selectedToken: XToken | null; — for token selection
};

export type FeatureActions = {
  // Setter for each state field: setFieldName: (value: Type) => void;
  // Always include:
  reset: () => void;
};

export type FeatureStore = FeatureState & FeatureActions;

export const defaultFeatureState: FeatureState = {
  // Default values for all state fields
};

export const createFeatureStore = (initState: FeatureState = defaultFeatureState) => {
  return createStore<FeatureStore>()((set, get) => ({
    ...initState,
    // Setters: setField: (value) => set({ field: value }),
    reset: () => set(defaultFeatureState),
  }));
};
```

Rules:
- Use `createStore` from `zustand/vanilla` (NOT `zustand`)
- Export types: `FeatureState`, `FeatureActions`, `FeatureStore`
- Export `defaultFeatureState` and `createFeatureStore`
- Use `persist` middleware ONLY if state should survive page reload
- Add enums for multi-step flows (e.g., `FEATURE_STEP`, `FEATURE_MODE`)

#### 2b. Store provider
**Create** `apps/web/app/(apps)/[feature]/_stores/[feature]-store-provider.tsx`:

```typescript
'use client';

import { type ReactNode, createContext, useRef, useContext, useMemo } from 'react';
import { useStore } from 'zustand';
import { type FeatureStore, createFeatureStore } from './[feature]-store';

export type FeatureStoreApi = ReturnType<typeof createFeatureStore>;
export const FeatureStoreContext = createContext<FeatureStoreApi | undefined>(undefined);

export interface FeatureStoreProviderProps {
  children: ReactNode;
}

export const FeatureStoreProvider = ({ children }: FeatureStoreProviderProps) => {
  const storeRef = useRef<FeatureStoreApi | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createFeatureStore();
  }
  return <FeatureStoreContext.Provider value={storeRef.current}>{children}</FeatureStoreContext.Provider>;
};

export const useFeatureStore = <T,>(selector: (store: FeatureStore) => T): T => {
  const context = useContext(FeatureStoreContext);
  if (!context) {
    throw new Error('useFeatureStore must be used within FeatureStoreProvider');
  }
  return useStore(context, selector);
};

// State hook — returns all state fields + derived computed values
export const useFeatureState = () => {
  // Select each state field individually for granular re-renders
  // Add useMemo for computed values (e.g., parsed amounts)
  // Return all state + computed values
};

// Actions hook — returns all action functions
export const useFeatureActions = () => {
  // Select each action individually
  // Return all actions
};
```

Rules:
- Always `'use client'`
- Store created once via `useRef` null-check
- Export exactly 3 hooks: `useFeatureStore`, `useFeatureState`, `useFeatureActions`
- `useFeatureState` includes `useMemo` for derived state (e.g., parsed bigint from string)
- Throw if used outside provider

---

### Step 3: Create page

**Create** `apps/web/app/(apps)/[feature]/page.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { itemVariants, listVariants } from '@/constants/animation';
import { useFeatureState, useFeatureActions } from './_stores/[feature]-store-provider';
// Import feature components from ./_components/
// Import wallet hooks from @sodax/wallet-sdk-react (useXAccount, etc.)
// Import dapp-kit hooks from @sodax/dapp-kit (useSodaxContext, etc.)
// Import app hooks from @/hooks/ (useTokenPrice, etc.)

export default function FeaturePage() {
  const { /* state fields */ } = useFeatureState();
  const { reset } = useFeatureActions();

  // Entrance animation
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setIsOpen(true), 500);
    return () => clearTimeout(t);
  }, []);

  // Reset store on unmount
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  return (
    <motion.div
      className="w-full flex flex-col justify-start items-start gap-(--layout-space-normal)"
      variants={listVariants}
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
    >
      <motion.div variants={itemVariants}>
        {/* Feature components here */}
      </motion.div>
    </motion.div>
  );
}
```

Rules:
- Always `'use client'`
- Entrance animation: `setTimeout(() => setIsOpen(true), 500)`
- Reset on unmount: `useEffect(() => () => { reset() }, [reset])`
- Wrap in `motion.div` with `listVariants`, children with `itemVariants`
- Import order: React → store hooks → feature components → wallet hooks → dapp-kit → app hooks → types → UI → animation → utils

---

### Step 4: Create components

**Create** `apps/web/app/(apps)/[feature]/_components/` directory with initial components:

Based on user's description, create appropriate components. Common patterns:

| Component | Purpose | When to create |
|-----------|---------|---------------|
| `[feature]-header.tsx` | Title, stats display | Always |
| `[feature]-input-panel.tsx` | Amount input, token selector | If has token input |
| `[feature]-button.tsx` | Main action button | Always |
| `[feature]-confirm-dialog.tsx` | Confirmation modal | If multi-step |
| `[feature]-selector-panel.tsx` | Option/token selection | If has selection |
| `[feature]-stats-card.tsx` | Metrics display | If shows data |

Each component:
- Kebab-case filename, PascalCase export
- Import store hooks from `../_stores/[feature]-store-provider`
- Use `motion.div` with `itemVariants` for animations
- Use shadcn/ui components from `@/components/ui/`
- Use shared components from `@/components/shared/` (CurrencyLogo, NetworkIcon, etc.)

Optionally **create** `apps/web/app/(apps)/[feature]/_components/index.ts` — barrel export (only if feature has many top-level components; some features like save/swap import directly without barrel).

Optional directories (create only if needed):
- `_constants/` — feature-specific constants (e.g., messages, enums). Only swap uses this.
- `_utils/` — feature-specific utility functions. Only migrate uses this.

---

### Step 5: Register route and navigation

#### 5a. Add route constant
**Modify** `apps/web/constants/routes.ts`:
```typescript
export const FEATURE_ROUTE = '/[feature]';
```

#### 5b. Add store provider to layout
**Modify** `apps/web/app/(apps)/layout.tsx`:
- Import `FeatureStoreProvider` from `./[feature]/_stores/[feature]-store-provider`
- Nest in provider stack (follow existing nesting order)

#### 5c. Add tab to route tabs
**Modify** `apps/web/components/shared/route-tabs.tsx`:
- Import route constant
- Add entry to `tabConfigs` array:
```typescript
{
  value: '[feature]',
  type: '[feature]',    // or reuse existing TabIconType from tab-icon.tsx
  label: 'Feature',
  content: 'description for hover',
  enabled: true,        // set false to hide in production initially
  href: FEATURE_ROUTE,
},
```

#### 5d. Add tab icon (if new icon type needed)
**Modify** `apps/web/components/shared/tab-icon.tsx`:
- Add case for new icon type in switch statement

---

### Step 6: Verify

```bash
pnpm lint          # Check for lint errors
pnpm checkTs       # Type check
pnpm dev:web       # Start dev server, navigate to /[feature]
```

Verify:
- [ ] Page loads without errors
- [ ] Route tab appears in navigation
- [ ] Store resets on page leave
- [ ] Entrance animation plays
- [ ] No console errors

---

### Step 7: Summary

```
Feature [feature] scaffolded!

Created (X files):
  apps/web/app/(apps)/[feature]/page.tsx
  apps/web/app/(apps)/[feature]/_stores/[feature]-store.ts
  apps/web/app/(apps)/[feature]/_stores/[feature]-store-provider.tsx
  apps/web/app/(apps)/[feature]/_components/[feature]-header.tsx
  apps/web/app/(apps)/[feature]/_components/[feature]-button.tsx
  apps/web/app/(apps)/[feature]/_components/index.ts

Modified (X files):
  apps/web/constants/routes.ts               — FEATURE_ROUTE
  apps/web/app/(apps)/layout.tsx             — FeatureStoreProvider
  apps/web/components/shared/route-tabs.tsx  — tab config

Next steps:
  1. Implement component UI and business logic
  2. Connect to SDK via @sodax/dapp-kit hooks
  3. Add wallet interaction via @sodax/wallet-sdk-react hooks
  4. Add tests if needed
```

---

## Important notes

- Always read the reference feature before writing — follow its pattern exactly
- Follow `apps/web/CLAUDE.md` for all conventions
- Do not create placeholder/lorem ipsum content — ask user for real copy
- If feature needs dapp-kit hooks that don't exist, note them as "Next steps: create hooks in packages/dapp-kit"
- Keep components small and focused — split complex UIs into subdirectories
- Use existing shared components (`@/components/shared/`) before creating new ones
