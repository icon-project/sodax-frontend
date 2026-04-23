import { useMemo } from 'react';
import type { ChainType } from '@sodax/types';
import {
  sortConnectors,
  useIsWalletInstalled,
  useXConnectors,
  type XConnector,
} from '@sodax/wallet-sdk-react';

type WalletListProps = {
  chainType: ChainType;
  onPick: (connector: XConnector) => void;
  onBack: () => void;
};

export function WalletList({ chainType, onPick, onBack }: WalletListProps) {
  const connectors = useXConnectors(chainType);
  // Hana goes first when present — same UX as apps/web today.
  const sorted = useMemo(() => sortConnectors(connectors, { preferred: ['hana'] }), [connectors]);
  const hasAnyWalletForChain = useIsWalletInstalled({ chainType });

  if (sorted.length === 0) {
    return (
      <div className="space-y-3 text-center text-sm text-gray-600">
        <p>No connectors registered for {chainType}.</p>
        <button onClick={onBack} className="text-blue-600 hover:underline">
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!hasAnyWalletForChain && (
        <div className="rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
          No wallet installed for this chain — install one of the listed providers to continue.
        </div>
      )}

      <ul className="divide-y divide-gray-200">
        {sorted.map(connector => (
          <li key={connector.id}>
            <button
              onClick={() => onPick(connector)}
              disabled={!connector.isInstalled}
              className="flex w-full items-center justify-between px-2 py-3 text-left hover:bg-gray-50 disabled:hover:bg-transparent"
            >
              <div className="flex items-center gap-3">
                {connector.icon ? (
                  <img src={connector.icon} alt="" className="h-6 w-6" />
                ) : (
                  <div className="h-6 w-6 rounded bg-gray-200" />
                )}
                <div>
                  <div className="font-medium">{connector.name}</div>
                  <div className="text-xs text-gray-500">id: {connector.id}</div>
                </div>
              </div>
              {connector.isInstalled ? (
                <span className="text-xs text-green-600">Installed</span>
              ) : connector.installUrl ? (
                <a
                  href={connector.installUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                  onClick={e => e.stopPropagation()}
                >
                  Install →
                </a>
              ) : (
                <span className="text-xs text-gray-400">Not installed</span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <button onClick={onBack} className="text-sm text-blue-600 hover:underline">
        ← Back to chains
      </button>
    </div>
  );
}
