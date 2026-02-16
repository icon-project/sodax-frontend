import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ChainId, XToken } from '@sodax/types';
import { chainIdToChainName } from '@/constants';
import { getChainExplorerTxUrl } from '@/lib/utils';
import { Check, Copy, ExternalLink } from 'lucide-react';

export type ActionType = 'supply' | 'withdraw' | 'borrow' | 'repay';

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  action: ActionType;
  data: {
    amount: string;
    token: XToken;
    sourceChainId: ChainId;
    destinationChainId: ChainId;
    txHash?: `0x${string}`;
  } | null;
}

export function SuccessModal({ open, onClose, data, action }: SuccessModalProps) {
  const [copied, setCopied] = useState(false);
  const txUrl = data?.txHash ? getChainExplorerTxUrl(data.sourceChainId, data.txHash) : undefined;

  const handleCopyHash = async (): Promise<void> => {
    if (!data?.txHash) return;
    await navigator.clipboard.writeText(data.txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const contentConfig: Record<ActionType, { title: string; label: string }> = {
    supply: { title: 'Assets Supplied', label: 'Amount supplied' },
    withdraw: { title: 'Withdrawal Complete', label: 'Amount withdrawn' },
    borrow: { title: 'Borrow Successful', label: 'Amount borrowed' },
    repay: { title: 'Debt Repaid', label: 'Amount repaid' },
  };

  const currentConfig = contentConfig[action];

  const renderDescription = () => {
    if (!data) return null;
    const sourceName = chainIdToChainName(data.sourceChainId) || data.sourceChainId;
    const destName = chainIdToChainName(data.destinationChainId) || data.destinationChainId;

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
            Your debt on <strong>{sourceName}</strong> has been successfully reduced.
          </p>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm border-cherry-grey/20">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-cherry-dark text-center">{currentConfig.title}</DialogTitle>
        </DialogHeader>

        {data && (
          <div className="flex flex-col gap-6 py-2">
            {/* Amount Section */}
            <div className="bg-cream rounded-lg p-4 text-center">
              <p className="text-sm uppercase tracking-wider text-clay mb-2">{currentConfig.label}</p>
              <p className="text-2xl font-bold text-cherry-dark font-mono">
                {Number(data.amount).toFixed(4)} {data.token.symbol}
              </p>
            </div>

            {/* Description Section */}
            <div className="min-h-[40px] flex items-center justify-center">{renderDescription()}</div>

            {/* Transaction Details Section (match partner claim: hash + copy + view on explorer) */}
            {data.txHash && (
              <div className=" border-t border-cherry-grey/10">
                <div className="flex items-center justify-center gap-2">
                  <p className="text-xs text-clay-light uppercase tracking-wide font-semibold">Transaction Hash</p>
                  <code className="text-sm font-mono text-clay whitespace-nowrap">
                    {data.txHash.slice(0, 4)}...{data.txHash.slice(-4)}
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

                {txUrl && (
                  <a
                    href={txUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full rounded-lg bg-cream-grey/40 px-4 py-2.5 text-sm text-cherry-dark font-medium hover:bg-cherry/10 transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on explorer
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button variant="cherry" onClick={onClose} className="w-full py-6 text-base">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
