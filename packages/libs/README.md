# @sodax/libs

Internal **dependency-isolation** package. Third-party libraries that need special build handling (bundling, stubbing, transformation) are re-exported through stable subpaths so the rest of the monorepo can consume them uniformly.

> ⚠️ **Not part of the public Sodax API.** Application code should import from `@sodax/sdk`, `@sodax/wallet-sdk-core`, or `@sodax/wallet-sdk-react` — those packages consume `@sodax/libs` internally.

## When to use this package

Add a subpath here whenever a third-party dependency needs a non-trivial build workaround that would otherwise have to be duplicated in multiple consumer packages. Common reasons:

- **Bundler incompatibility** — circular imports, scope-hoisting cycles, or broken UMD/dead-code patterns that crash a consumer's bundler (Webpack, Turbopack, Vite…).
- **Dynamic-import static analysis** — `await import()` patterns that bundlers try to resolve eagerly, pulling in unused heavy deps.
- **Unused transitive deps** — pulling in WalletConnect / UI / hardware wallet code that SODAX never exercises at runtime but that balloons the bundle.
- **Forced single-copy bundling** — code that should ship once across the dep chain instead of being re-bundled by each consumer.

If the dep "just works" when consumers import it directly, it does **not** belong here.

## Current subpaths

| Subpath | Bundles | Purpose | Consumed by |
|---|---|---|---|
| `@sodax/libs/stacks/core` | `@stacks/transactions`, `@stacks/network` | bundle to bypass Turbopack scope-hoisting cycle ([#1070](https://github.com/icon-project/sodax-frontend/issues/1070)) | sdk, wallet-sdk-core, wallet-sdk-react |
| `@sodax/libs/stacks/connect` | `@stacks/connect` | bundle + stub unused WalletConnect / UI deps (`@reown/appkit*`, `@stacks/connect-ui`, `cross-fetch`) | wallet-sdk-core, wallet-sdk-react |
| `@sodax/libs/injective/wallet-strategy` | `@injectivelabs/wallet-strategy` | bundle + stub hardware wallet packages (`wallet-ledger`, `wallet-trezor`, `wallet-magic`, `wallet-turnkey`, `wallet-wallet-connect`) | wallet-sdk-react |

## Adding a new subpath

1. **Group by npm scope.** Put new subpaths under a folder matching the source package's scope — e.g. `@foo/bar-baz` → `src/foo/bar-baz/index.ts`, exposed as `@sodax/libs/foo/bar-baz`.
2. **Re-export only what consumers need.** Keep the surface minimal so the transform is easy to review.
3. **Wire up `package.json` `exports`** with `types` / `import` / `require` conditions mirroring the subpath.
4. **Add a tsup `entry`** for the subpath in `tsup.config.ts`, plus whatever `noExternal` / stub / external adjustments are needed.
5. **Add a `TODO` comment** at the top of `src/<scope>/<name>/index.ts` explaining *why* the bundle is needed and *when* it can be removed.
6. **Update this README's "Current subpaths" table.**
7. **(Recommended) Add a build-time invariant** under `scripts/` if the workaround depends on the shape of the upstream package — catches silent drift on upgrades. See `scripts/verify-stacks-connect-ui-stub.mjs` for the pattern.

Design goals for each subpath:
- Build output stays small — prefer browser `mainFields` so packages with browser / XHR entries drop their Node-only adapters.
- Externalize Node builtins explicitly (`platform: 'neutral'` + `'browser'` doesn't auto-externalize them).
- Keep any stub plugin in the shared plugin list at the top of `tsup.config.ts` — don't duplicate per subpath.

## Removing a subpath

Each subpath is a workaround. Revisit it when the upstream package releases a fix:
1. Verify the upstream fix addresses the original issue (ideally reproduce with a minimal example).
2. Change consumer imports from `@sodax/libs/<subpath>` back to the original npm package.
3. Remove the `entry`, `noExternal`, and any related stubs / externals from `tsup.config.ts`.
4. Remove the subpath from `package.json` `exports` and the `src/` folder.
5. Remove the companion drift-detection script if present.
6. Update this README.
