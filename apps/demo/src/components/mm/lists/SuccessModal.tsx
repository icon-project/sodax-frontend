import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ChainId, XToken } from '@sodax/types';
import { chainIdToChainName } from '@/constants';
import { getChainExplorerTxUrl } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

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
  const txUrl = data?.txHash ? getChainExplorerTxUrl(data.sourceChainId, data.txHash) : undefined;

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

            {/* Transaction Details Section */}
            {data.txHash && (
              <div className="pt-6 border-t border-cherry-grey/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-clay-light uppercase tracking-widest font-bold">
                    Transaction Details
                  </span>
                </div>

                <a
                  href={txUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full p-3 rounded-xl bg-cream-white border border-cherry-grey/30 hover:border-cherry/50 hover:bg-cherry/[0.02] transition-all group"
                >
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-xs text-clay-light font-medium leading-none">Hash</span>
                    <code className="text-sm font-mono text-clay group-hover:text-cherry-dark transition-colors">
                      {data.txHash.slice(0, 6)}...{data.txHash.slice(-4)}
                    </code>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-cherry font-medium bg-cherry/5 px-3 py-1.5 rounded-lg group-hover:bg-cherry group-hover:text-white transition-all">
                    <span>Explorer</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                </a>
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
