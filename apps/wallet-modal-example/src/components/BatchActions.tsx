import { useState } from 'react';
import {
  useBatchConnect,
  useBatchDisconnect,
  useConnectedChains,
  useIsWalletInstalled,
  type BatchConnectResult,
  type BatchDisconnectResult,
} from '@sodax/wallet-sdk-react';

const HANA = ['hana'] as const;

export function BatchActions() {
  const isHanaInstalled = useIsWalletInstalled({ connectors: HANA });
  const { total } = useConnectedChains();

  const connectAllHana = useBatchConnect({ connectors: HANA });
  const connectRestHana = useBatchConnect({ connectors: HANA, skipConnected: true });
  const disconnectHana = useBatchDisconnect({ connectors: HANA });
  const disconnectAll = useBatchDisconnect();

  const [last, setLast] = useState<{
    label: string;
    result: BatchConnectResult | BatchDisconnectResult | null;
  } | null>(null);

  const isAnyRunning =
    connectAllHana.status === 'running' ||
    connectRestHana.status === 'running' ||
    disconnectHana.status === 'running' ||
    disconnectAll.status === 'running';

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Batch operations</div>

      {isHanaInstalled ? (
        <div className="grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            disabled={isAnyRunning}
            onClick={async () => setLast({ label: 'Connect All Hana', result: await connectAllHana.run() })}
            className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {connectAllHana.status === 'running' ? 'Connecting…' : 'Connect All Hana'}
          </button>

          <button
            type="button"
            disabled={isAnyRunning || total === 0}
            onClick={async () => setLast({ label: 'Connect Rest with Hana', result: await connectRestHana.run() })}
            className="rounded border border-blue-600 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
            title="Skip chains already connected"
          >
            {connectRestHana.status === 'running' ? 'Connecting…' : 'Connect Rest Hana'}
          </button>

          <button
            type="button"
            disabled={isAnyRunning || total === 0}
            onClick={async () => setLast({ label: 'Disconnect Hana', result: await disconnectHana.run() })}
            className="rounded border border-gray-400 px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            {disconnectHana.status === 'running' ? 'Disconnecting…' : 'Disconnect Hana'}
          </button>
        </div>
      ) : (
        <div className="rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
          Hana wallet not detected — install the Hana extension to enable batch buttons.
        </div>
      )}

      <button
        type="button"
        disabled={isAnyRunning || total === 0}
        onClick={async () => setLast({ label: 'Disconnect All', result: await disconnectAll.run() })}
        className="w-full rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
      >
        {disconnectAll.status === 'running' ? 'Disconnecting…' : 'Disconnect All'}
      </button>

      {last && last.result && (
        <div className="rounded border border-gray-200 bg-gray-50 p-3 text-xs">
          <div className="mb-1 font-medium text-gray-800">Last: {last.label}</div>
          <div className="text-green-700">✓ Successful: {last.result.successful.join(', ') || '—'}</div>
          {'skipped' in last.result && (
            <div className="text-gray-600">⊘ Skipped: {last.result.skipped.join(', ') || '—'}</div>
          )}
          <div className="text-red-700">
            ✗ Failed:{' '}
            {last.result.failed.length === 0
              ? '—'
              : last.result.failed.map(f => `${f.chainType} (${f.error.message})`).join(', ')}
          </div>
        </div>
      )}
    </div>
  );
}
