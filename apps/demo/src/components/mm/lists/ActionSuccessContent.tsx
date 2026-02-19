// Reusable success screen content shown after a successful money market action (supply/withdraw/borrow/repay).
// This component displays transaction details, amount, and provides a link to view the transaction on-chain.

import React, { useState, type ReactElement } from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ChainId, XToken } from '@sodax/types';
import { chainIdToChainName } from '@/constants';
import { getChainExplorerTxUrl } from '@/lib/utils';
import { useSodaxScanMessageUrl } from '@/hooks/useSodaxScanMessageUrl';
import { Check, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { COPY_FEEDBACK_TIMEOUT_MS, TX_HASH_DISPLAY_LENGTH } from '../constants';

export type ActionSuccessType = 'supply' | 'withdraw' | 'borrow' | 'repay';

export type ActionSuccessData = {
  amount: string;
  token: XToken;
  sourceChainId: ChainId;
  destinationChainId: ChainId;
  txHash?: `0x${string}`;
};

interface ActionSuccessContentProps {
  action: ActionSuccessType;
  data: ActionSuccessData;
  onClose: () => void;
}

export function ActionSuccessContent({ action, data, onClose }: ActionSuccessContentProps): ReactElement {
  // Tracks whether transaction hash was copied to clipboard (for UI feedback)
  const [copied, setCopied] = useState(false);
  // Prefer SodaxScan message URL; fall back to chain explorer when not available
  const { url: sodaxScanUrl, isLoading: sodaxScanLoading } = useSodaxScanMessageUrl(data.txHash);
  const explorerUrl = data.txHash ? getChainExplorerTxUrl(data.sourceChainId, data.txHash) : undefined;
  const txUrl = sodaxScanUrl ?? explorerUrl;

  // Copy transaction hash to clipboard and show visual feedback
  const handleCopyHash = async (): Promise<void> => {
    if (!data.txHash) return;
    await navigator.clipboard.writeText(data.txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_TIMEOUT_MS);
  };

  // Configuration for each action type's success message
  const contentConfig: Record<ActionSuccessType, { title: string; label: string }> = {
    supply: { title: 'Assets Supplied', label: 'Amount supplied' },
    withdraw: { title: 'Withdrawal Complete', label: 'Amount withdrawn' },
    borrow: { title: 'Borrow Successful', label: 'Amount borrowed' },
    repay: { title: 'Debt Repaid', label: 'Amount repaid' },
  };

  const currentConfig = contentConfig[action];
  const sourceName = chainIdToChainName(data.sourceChainId) || data.sourceChainId;
  const destName = chainIdToChainName(data.destinationChainId) || data.destinationChainId;

  // Render action-specific success message describing what happened
  const renderDescription = (): ReactElement | null => {
    switch (action) {
      case 'supply':
        return (
          <p className="text-sm text-clay text-center px-2">
            Your <strong>{data.token.symbol}</strong> is now earning interest on <strong>{sourceName}</strong>.
          </p>
        );
      case 'withdraw':
        return (
          <p className="text-sm text-clay text-center px-2">
            You will see <strong>{data.token.symbol}</strong> in your wallet on <strong>{destName}</strong>.
          </p>
        );
      case 'borrow':
        return (
          <p className="text-sm text-clay text-center px-2">
            Funds sent to <strong>{destName}</strong>. Your debt is recorded on <strong>{sourceName}</strong>.
          </p>
        );
      case 'repay':
        return (
          <p className="text-sm text-clay text-center px-2">
            Your debt <strong>{data.token.symbol}</strong> has been successfully repaid.
          </p>
        );
      default:
        return null;
    }
  };

  const amountNumber = Number(data.amount);

  return (
    <div className="flex flex-col gap-6 py-2">
      <DialogHeader className="pb-2">
        <DialogTitle className="text-cherry-dark text-center">{currentConfig.title}</DialogTitle>
      </DialogHeader>

      <div className="bg-cream rounded-lg p-4 text-center">
        <p className="text-sm uppercase tracking-wider text-clay mb-2">{currentConfig.label}</p>
        <p className="text-2xl font-bold text-cherry-dark font-mono">
          {Number.isFinite(amountNumber) ? amountNumber.toFixed(4) : data.amount} {data.token.symbol}
        </p>
      </div>

      <div className="min-h-[40px] flex items-center justify-center">{renderDescription()}</div>

      {data.txHash && (
        <div className=" border-t border-cherry-grey/10">
          <div className="flex items-center justify-center gap-2">
            <p className="text-xs text-clay-light uppercase tracking-wide font-semibold">Transaction Hash</p>
            <code className="text-sm font-mono text-clay whitespace-nowrap">
              {data.txHash.slice(0, TX_HASH_DISPLAY_LENGTH)}...{data.txHash.slice(-TX_HASH_DISPLAY_LENGTH)}
            </code>
            <button
              type="button"
              onClick={handleCopyHash}
              className="shrink-0 p-1.5 rounded hover:bg-cherry/10 text-clay-light hover:text-cherry transition"
              title={copied ? 'Copied!' : 'Copy hash'}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {(txUrl || sodaxScanLoading) &&
            (sodaxScanLoading ? (
              <div className="flex items-center justify-center gap-2 w-full rounded-lg bg-cream-grey/40 px-4 py-2.5 text-sm text-clay">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading link…
              </div>
            ) : txUrl ? (
              <a
                href={txUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-cream-grey/40 px-4 py-2.5 text-sm text-cherry-dark font-medium hover:bg-cherry/10 transition"
              >
                <ExternalLink className="w-4 h-4" />
                {sodaxScanUrl ? 'View on SodaxScan' : 'View on explorer'}
              </a>
            ) : null)}
        </div>
      )}

      <DialogFooter className="pt-2">
        <Button variant="cherry" onClick={onClose} className="w-full py-6 text-base">
          Close
        </Button>
      </DialogFooter>
    </div>
  );
}
