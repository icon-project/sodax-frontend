import { useWalletModal } from '@sodax/wallet-sdk-react';
import { WalletModal } from './components/WalletModal';
import { ConnectedChains } from './components/ConnectedChains';
import { BatchActions } from './components/BatchActions';
import { ConnectionFlowDemo } from './components/ConnectionFlowDemo';

function OpenModalButton() {
  const { state, open } = useWalletModal();
  return (
    <button
      onClick={open}
      disabled={state.kind !== 'closed'}
      className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      {state.kind === 'closed' ? 'Open wallet modal' : 'Modal already open'}
    </button>
  );
}

export default function App() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Sodax Headless Wallet Modal — Demo</h1>
        <p className="text-sm text-gray-600">
          Reference app exercising every primitive in{' '}
          <code className="rounded bg-gray-100 px-1">@sodax/wallet-sdk-react</code> shipped under
          issue #1123.
        </p>
      </header>

      <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold">Open the modal</h2>
        <OpenModalButton />
        <p className="text-xs text-gray-500">
          Driven by <code>useWalletModal()</code>. The modal is rendered below as a sibling — both
          buttons and the modal share the same Zustand-backed state machine.
        </p>
      </section>

      <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold">Connected chains</h2>
        <ConnectedChains />
      </section>

      <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold">Batch operations</h2>
        <BatchActions />
      </section>

      <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <ConnectionFlowDemo />
      </section>

      <WalletModal />

      <footer className="pt-4 text-center text-xs text-gray-400">
        See <code>README.md</code> for the primitive ↔ component mapping.
      </footer>
    </div>
  );
}
