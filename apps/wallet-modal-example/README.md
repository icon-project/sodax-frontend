# wallet-modal-example

Reference app exercising every headless primitive shipped under issue
[#1123](https://github.com/icon-project/sodax-frontend/issues/1123) in
`@sodax/wallet-sdk-react`. No design system, no DeFi business logic — only
the wallet modal flow.

## Run

```bash
pnpm install
pnpm --filter @sodax/wallet-modal-example dev
# → http://localhost:3002
```

## What it covers

| Component                            | Primitive demonstrated                                       | Phase |
| ------------------------------------ | ------------------------------------------------------------ | ----- |
| `components/WalletModal.tsx`         | `useWalletModal` — discriminated-union state machine          | 5     |
| `components/ChainList.tsx`           | `useChainGroups` — EVM as one logical chain                  | 2     |
| `components/WalletList.tsx`          | `useXConnectors` (enriched) + `sortConnectors` + `useIsWalletInstalled` | 1 |
| `components/ConnectingView.tsx`     | Renders `state.connector` from `useWalletModal`              | 5     |
| `components/ErrorView.tsx`          | Renders `state.error` + `retry()` from `useWalletModal`      | 5     |
| `components/ConnectedChains.tsx`     | `useConnectedChains` — aggregate view + `status` hydration   | 2     |
| `components/BatchActions.tsx`        | `useBatchConnect` + `useBatchDisconnect` (Hana scope + universal disconnect) | 4 |
| `components/ConnectionFlowDemo.tsx`  | `useConnectionFlow` — standalone (no modal)                  | 3     |

Together these cover the full §A-G primitive surface from the spec, with
no fallback to internal SDK helpers.

## Patterns shown

- **Modal flow** — `switch (modal.state.kind)` renders different views with
  type-narrowed access to `chainType`/`connector`/`account`/`error`.
- **EVM = one click** — `ChainList` shows network count from
  `chainGroups[i].chainIds.length`. Picking EVM connects all wagmi networks
  via a single connector.
- **Cross-chain wallet detection** — `useIsWalletInstalled({ connectors: ['hana'] })`
  conditionally renders the Hana batch CTAs. Same hook with
  `{ chainType: 'BITCOIN' }` would scope the check.
- **Best-effort batch** — `BatchActions` renders the last batch result
  panel: `successful`, `failed` (with per-chain error message), and
  `skipped` (when `skipConnected: true`).
- **Multi-entry sync** — `OpenModalButton` (header) and `WalletModal` body
  read the same `useWalletModal()` state. Opening from one location
  reflects in the other; the header button disables while the modal flow
  is in progress.
- **Standalone connect** — `ConnectionFlowDemo` proves `useConnectionFlow`
  is usable without `useWalletModal`, e.g. for inline reconnect CTAs in a
  settings page.

## Out of scope

- App-specific business flows (registration, terms-of-service, routing).
  The `WalletModal.tsx` `onConnected` callback shows where they'd plug in.
- Multi-wallet batch examples (e.g. `connectors: ['hana', 'phantom']`) —
  the API supports it, but covering it here would noise the demo. See
  `phase-4.md` plan doc for the full API.
- Themed `<WalletModal />` component shipped from the SDK — explicitly
  out of scope for #1123 (parent issue #989).
