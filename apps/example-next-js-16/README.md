# example-next-js-16

Regression test app for [icon-project/sodax-frontend#1070](https://github.com/icon-project/sodax-frontend/issues/1070).

A minimal Next.js 16 (Turbopack) app that consumes `@sodax/sdk`,
`@sodax/wallet-sdk-core`, `@sodax/wallet-sdk-react`, and `@sodax/dapp-kit`
from the workspace, and exercises the `@stacks/*` bundling paths in both
the server and client bundles.

## Background

Before the fix, `next build` of any Next 16 app importing `@sodax/sdk`
crashed at SSR prerender with:

```
Error: Module XXXXXX was instantiated because it was required from module YYYYYY,
but the module factory is not available.
```

Root causes (all upstream Turbopack scope-hoisting bugs):

1. **`@stacks/transactions`** — Turbopack scope-hoists named imports and
   hits an internal cycle. Reproduces with a bare `import { Cl } from
   '@stacks/transactions'` in a fresh Next 16 app — no Sodax code required.
2. **`@stacks/connect`** — imports `@stacks/transactions` internally →
   same cycle in the client bundle.
3. **`@injectivelabs/wallet-ledger`** — bundles CryptoJS UMD with dead
   AMD `define(["./core"])` branches that Turbopack parses as real imports.

### Fix (this PR)

Problem dependencies are isolated into a dedicated `@sodax/libs` package
that sits at the bottom of the monorepo dependency chain. Each problem
dep is exposed through its own subpath, bundled with the necessary
workarounds. Downstream packages (`sdk`, `wallet-sdk-core`,
`wallet-sdk-react`) consume the subpaths — the code ships exactly once
across the entire chain.

- **`@stacks/transactions` + `@stacks/network`** — bundled into
  `@sodax/libs/stacks/core` via tsup `noExternal`.
- **`@stacks/connect`** — bundled into `@sodax/libs/stacks/connect`.
  Unused transitive deps (`@reown/appkit`, `@stacks/connect-ui`,
  `cross-fetch`) are replaced with noop stubs via an esbuild `onResolve`
  plugin. SODAX only uses browser extension wallets (Leather, Xverse)
  and passes the provider directly via `request({ provider }, ...)`,
  so WalletConnect / UI picker code is never reached.
  A build-time script (`verify-stacks-connect-ui-stub.mjs`) catches
  drift in `@stacks/connect-ui` named imports.
- **`@injectivelabs/wallet-strategy`** — bundled into
  `@sodax/libs/injective/wallet-strategy`. Hardware wallet packages
  (`wallet-ledger`, `wallet-trezor`, `wallet-magic`, `wallet-turnkey`,
  `wallet-wallet-connect`) — dynamically imported by `wallet-strategy`
  and statically analyzed by Turbopack — are stubbed to empty modules
  (SODAX only uses browser wallets).

The dist no longer contains any top-level import that triggers a
Turbopack cycle, so the build succeeds.

## Routes

- `/` — **server component.** Runs at SSR prerender during `next build`.
  Calls `encodeAddress('stacks', ...)` and `serializeAddressData(...)`,
  which exercise the bundled `@stacks/transactions` code path at runtime.
  Verified automatically by `verify-build.mjs`, which greps the
  prerendered HTML for expected Stacks principal hex values.

- `/client` — **client component.** Exercises the Turbopack browser
  bundle of the full provider stack (`SodaxProvider`, `SodaxWalletProvider`,
  `QueryClientProvider`) and all 9 chain connectors. Turbopack produces
  server and client bundles separately and could in theory have
  different scope-hoisting outcomes, so we test both.

## Verifying

### Automated (run in CI)

```bash
pnpm --filter example-next-js-16 verify
```

Runs `next build` then `verify-build.mjs`, which:
1. Greps the prerendered SSR HTML for expected Stacks hex values.
2. Starts `next start`, fetches `/` and `/client`, and asserts the
   provider stack renders without hydration errors or Turbopack module
   factory errors.

Exits 1 on any failure.

### Manual client inspection

```bash
pnpm --filter example-next-js-16 build
pnpm --filter example-next-js-16 start
# open http://localhost:3016/client
```

Expect: page renders the SDK/wallet-core export counts, encoded Stacks
values, and a wallet connect UI for all 9 chains within ~100ms of mount.

Failure signals:
- Browser DevTools console shows
  `Module XXX was instantiated... module factory is not available` —
  the Turbopack cycle is back.
- `Module not found: Can't resolve './core'` — a new Injective CryptoJS
  path slipped past the stub plugin.
