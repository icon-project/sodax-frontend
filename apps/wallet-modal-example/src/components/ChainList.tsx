import type { ChainType } from '@sodax/types';
import { useChainGroups } from '@sodax/wallet-sdk-react';

type ChainListProps = {
  onPick: (chainType: ChainType) => void;
};

export function ChainList({ onPick }: ChainListProps) {
  const groups = useChainGroups();

  return (
    <ul className="divide-y divide-gray-200">
      {groups.map(group => (
        <li key={group.chainType}>
          <button
            onClick={() => onPick(group.chainType)}
            className="flex w-full items-center justify-between px-2 py-3 text-left hover:bg-gray-50"
          >
            <div>
              <div className="font-medium">{group.displayName}</div>
              <div className="text-xs text-gray-500">
                {group.chainIds.length} {group.chainIds.length === 1 ? 'network' : 'networks'}
                {group.isConnected ? ' · connected' : ''}
              </div>
            </div>
            <span className="text-gray-400">{group.isConnected ? '✓' : '→'}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
