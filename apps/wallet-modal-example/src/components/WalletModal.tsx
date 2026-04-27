import { useWalletModal, type WalletModalState } from '@sodax/wallet-sdk-react';
import { ChainList } from './ChainList';
import { WalletList } from './WalletList';
import { ConnectingView } from './ConnectingView';
import { ErrorView } from './ErrorView';

export function WalletModal() {
  const modal = useWalletModal({
    onConnected: (chainType, account) => {
      // Demo only — apps would route, persist, open ToS modal here.
      console.log(`[onConnected] ${chainType}: ${account.address}`);
    },
  });

  if (modal.state.kind === 'closed') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{titleFor(modal.state.kind)}</h2>
          <button
            type="button"
            onClick={modal.close}
            className="text-gray-500 hover:text-gray-900"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        {modal.state.kind === 'chainSelect' && <ChainList onPick={modal.selectChain} />}

        {modal.state.kind === 'walletSelect' && (
          <WalletList
            chainType={modal.state.chainType}
            onPick={modal.selectWallet}
            onBack={modal.back}
          />
        )}

        {modal.state.kind === 'connecting' && (
          <ConnectingView
            chainType={modal.state.chainType}
            connectorName={modal.state.connector.name}
            onCancel={modal.back}
          />
        )}

        {modal.state.kind === 'error' && (
          <ErrorView
            chainType={modal.state.chainType}
            connectorName={modal.state.connector.name}
            error={modal.state.error}
            onRetry={modal.retry}
            onBack={modal.back}
          />
        )}

        {modal.state.kind === 'success' && (
          <div className="space-y-3 text-center">
            <p className="text-green-700">
              Connected {modal.state.chainType} via {modal.state.connector.name}
            </p>
            <code className="block break-all rounded bg-gray-100 p-2 text-xs">
              {modal.state.account.address}
            </code>
            <button
              type="button"
              onClick={modal.close}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Typed against the union — adding a new `WalletModalState` variant
// surfaces a compile-time switch-exhaustiveness error instead of
// silently falling through to the default branch.
function titleFor(kind: WalletModalState['kind']): string {
  switch (kind) {
    case 'chainSelect':
      return 'Select chain';
    case 'walletSelect':
      return 'Select wallet';
    case 'connecting':
      return 'Connecting…';
    case 'error':
      return 'Connection failed';
    case 'success':
      return 'Connected';
    case 'closed':
      return '';
  }
}
