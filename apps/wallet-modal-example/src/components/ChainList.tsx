import { useState } from 'react';
import type { ChainType } from '@sodax/types';
import { useChainGroups, useXDisconnect } from '@sodax/wallet-sdk-react';

type ChainListProps = {
  onPick: (chainType: ChainType) => void;
};

/**
 * Click semantics mirror `apps/web`'s chain list:
 * - chain NOT connected → navigate to wallet picker via `onPick(chainType)`.
 * - chain already connected → disconnect in place (1-click toggle), so the
 *   user explicitly drops the active wallet before switching. This avoids
 *   surprising the user with a hidden disconnect-before-connect when they
 *   pick a different wallet on a chain they're still using.
 */
export function ChainList({ onPick }: ChainListProps) {
  const groups = useChainGroups();
  const disconnect = useXDisconnect();
  const [pendingDisconnect, setPendingDisconnect] = useState<ChainType | null>(null);

  const handleClick = async (chainType: ChainType, isConnected: boolean): Promise<void> => {
    if (!isConnected) {
      onPick(chainType);
      return;
    }
    setPendingDisconnect(chainType);
    try {
      await disconnect(chainType);
    } finally {
      setPendingDisconnect(null);
    }
  };

  return (
    <ul className="divide-y divide-gray-200">
      {groups.map(group => {
        const isPending = pendingDisconnect === group.chainType;
        return (
          <li key={group.chainType}>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleClick(group.chainType, group.isConnected)}
              className="flex w-full items-center justify-between px-2 py-3 text-left hover:bg-gray-50 disabled:opacity-60"
            >
              <div>
                <div className="font-medium">{group.displayName}</div>
                <div className="text-xs text-gray-500">
                  {group.chainIds.length} {group.chainIds.length === 1 ? 'network' : 'networks'}
                  {group.isConnected ? ' · connected' : ''}
                </div>
              </div>
              <span className="text-gray-400">
                {isPending ? '…' : group.isConnected ? '−' : '→'}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
