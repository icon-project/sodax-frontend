import { useConnectedChains } from '@sodax/wallet-sdk-react';

export function ConnectedChains() {
  const { chains, total, status } = useConnectedChains();

  if (status === 'loading') {
    return <p className="text-sm text-gray-500">Restoring connections…</p>;
  }

  if (total === 0) {
    return <p className="text-sm text-gray-600">No chains connected.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Connected ({total})</div>
      <ul className="divide-y divide-gray-200 rounded border border-gray-200 bg-white">
        {chains.map(c => (
          <li key={c.chainType} className="flex items-center justify-between gap-3 px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              {c.connectorIcon && <img src={c.connectorIcon} alt="" className="h-5 w-5" />}
              <span className="font-medium">{c.chainType}</span>
              <span className="text-xs text-gray-500">{c.connectorName ?? c.connectorId}</span>
            </div>
            <code className="truncate text-xs text-gray-600" title={c.account.address}>
              {shortAddress(c.account.address)}
            </code>
          </li>
        ))}
      </ul>
    </div>
  );
}

function shortAddress(address: string | undefined): string {
  if (!address) return '—';
  if (address.length <= 14) return address;
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}
