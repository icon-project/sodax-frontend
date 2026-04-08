# example-next-js-16

Regression test app for [icon-project/sodax-frontend#1070](https://github.com/icon-project/sodax-frontend/issues/1070).

A minimal Next.js 16 (Turbopack) app that consumes `@sodax/sdk` from the
workspace and exercises the lazy `@stacks/transactions` loading paths in
both the server and client bundles.

## Background

Before the fix, `next build` of any Next 16 app importing `@sodax/sdk`
crashed at SSR prerender with:

```
Error: Module XXXXXX was instantiated because it was required from module YYYYYY,
but the module factory is not available.
```

Root cause: Turbopack scope-hoists `@stacks/transactions` (a transitive
dep of `@sodax/sdk`) and hits an internal cycle in that package.
The bug reproduces with a bare named import (`import { Cl } from '@stacks/transactions'`)
in a fresh Next 16 app — no Sodax code required — so the root cause is
upstream Turbopack, not Sodax. See PLAN doc for the full investigation.

The SDK-side fix converts the 4 SDK files that touch `@stacks/transactions`
and `@stacks/network` from top-level static imports to lazy
`await import()` inside async functions, with a sync cache and
fire-and-forget preload for the synchronous `encodeAddress` path. The dist
no longer contains any top-level static `@stacks/*` import, so Turbopack
never scope-hoists the package, and the cycle is never reached.

## Routes

- `/` — **server component.** Runs at SSR prerender during `next build`.
  Calls `encodeAddress('stacks', ...)` which exercises SDK's lazy
  `await import('@stacks/transactions')` chain at runtime. Verified
  automatically by `verify-build.mjs`, which greps the prerendered HTML
  for the expected Stacks principal hex (`0x0516...`).

- `/client` — **client component.** Exercises the Turbopack browser
  bundle of `@sodax/sdk`. Same lazy path, different bundle — Turbopack
  produces server and client bundles separately and could in theory have
  different scope-hoisting outcomes, so we test both.

## Verifying

### SSR / server bundle (automated, run in CI)

```bash
pnpm --filter example-next-js-16 verify
```

Builds the app and asserts that the prerendered HTML contains the
expected Stacks principal hex `0x0516...`. Exits 1 if the lazy stacks
path failed to run during SSR.

### Client / browser bundle (manual)

```bash
pnpm --filter example-next-js-16 build
pnpm --filter example-next-js-16 start
# open http://localhost:3016/client
```

Expect: page renders `encoded: 0x05160000...` within ~100ms of mount.

Failure signals:
- Page text shows `FAILED: ...` — lazy path threw on every retry.
- Browser DevTools console shows
  `Module XXX was instantiated... module factory is not available` —
  client bundle still has the cycle.

## Reproducing the original bug locally

To see the bug come back:

1. Revert the lazy-load changes in `packages/sdk/src/shared/{utils/stacks-utils.ts,utils/shared-utils.ts,services/spoke/StacksSpokeService.ts,entities/stacks/StacksSpokeProvider.ts}`
2. `pnpm --filter @sodax/sdk build`
3. `rm -rf apps/example-next-js-16/.next && pnpm --filter example-next-js-16 build`
4. Build fails at "Generating static pages" with the module-factory error.
