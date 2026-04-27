import { useConnectionFlow, useXConnectors } from '@sodax/wallet-sdk-react';

/**
 * Standalone connect button — proves `useConnectionFlow` is usable WITHOUT
 * `useWalletModal`. Picks the first ICON connector and exposes raw status,
 * error, retry. Useful pattern for inline "reconnect" CTAs in settings pages.
 */
export function ConnectionFlowDemo() {
  const flow = useConnectionFlow();
  const iconConnectors = useXConnectors('ICON');
  const target = iconConnectors[0];

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">useConnectionFlow (standalone, inline)</div>
      <p className="text-xs text-gray-600">
        Connect ICON without going through the modal. Demonstrates direct status / error / retry.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!target || flow.status === 'connecting'}
          onClick={() => target && flow.connect(target)}
          className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {flow.status === 'connecting'
            ? 'Connecting…'
            : `Connect ${target ? target.name : 'ICON (no connector)'}`}
        </button>

        {flow.status === 'error' && (
          <button
            type="button"
            onClick={flow.retry}
            className="rounded border border-indigo-600 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50"
          >
            Retry
          </button>
        )}

        <button
          type="button"
          onClick={flow.reset}
          disabled={flow.status === 'idle'}
          className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
        >
          Reset
        </button>
      </div>

      <div className="text-xs">
        <span className="font-medium">status:</span> {flow.status}
      </div>
      {flow.activeConnector && (
        <div className="text-xs">
          <span className="font-medium">activeConnector:</span> {flow.activeConnector.name} (
          {flow.activeChainType})
        </div>
      )}
      {flow.error && (
        <div className="text-xs text-red-700">
          <span className="font-medium">error:</span> {flow.error.message}
        </div>
      )}
    </div>
  );
}
