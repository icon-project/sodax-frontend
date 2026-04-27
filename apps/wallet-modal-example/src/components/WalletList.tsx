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
        <button type="button" onClick={onBack} className="text-blue-600 hover:underline">
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
          <li key={connector.id} className="flex items-center justify-between px-2 py-3">
            <ConnectorInfo connector={connector} />
            {connector.isInstalled ? (
              <button
                type="button"
                onClick={() => onPick(connector)}
                className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
              >
                Connect
              </button>
            ) : connector.installUrl ? (
              // Install link must live outside the row-level button — nested
              // interactive content (<a href> inside <button>) violates HTML5
              // and breaks some screen reader / browser combos.
              <a
                href={connector.installUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                Install →
              </a>
            ) : (
              <span className="text-xs text-gray-400">Not installed</span>
            )}
          </li>
        ))}
      </ul>

      <button type="button" onClick={onBack} className="text-sm text-blue-600 hover:underline">
        ← Back to chains
      </button>
    </div>
  );
}

function ConnectorInfo({ connector }: { connector: XConnector }) {
  return (
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
  );
}
