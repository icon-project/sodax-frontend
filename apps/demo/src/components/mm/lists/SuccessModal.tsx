import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import type { ChainId, XToken } from '@sodax/types';
import { chainIdToChainName } from '@/constants';

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
  } | null;
}

export function SuccessModal({ open, onClose, data, action }: SuccessModalProps) {
  // Mapping only the labels and titles to keep the logic clean
  const contentConfig: Record<ActionType, { title: string; label: string }> = {
    supply: {
      title: 'Assets Supplied',
      label: 'Amount supplied',
    },
    withdraw: {
      title: 'Withdrawal Complete',
      label: 'Amount withdrawn',
    },
    borrow: {
      title: 'Borrow Successful',
      label: 'Amount borrowed',
    },
    repay: {
      title: 'Debt Repaid',
      label: 'Amount repaid',
    },
  };

  const currentConfig = contentConfig[action];
  // A helper to render the dynamic description based on the action
  const renderDescription = () => {
    if (!data) return null;
    const sourceName = chainIdToChainName(data.sourceChainId) || data.sourceChainId;
    const destName = chainIdToChainName(data.destinationChainId) || data.destinationChainId;

    switch (action) {
      case 'supply':
        return (
          <p className="text-sm text-clay text-center">
            Your <strong>{data.token.symbol}</strong> is now earning interest on <strong>{sourceName}</strong>. 📈
          </p>
        );
      case 'withdraw':
        return (
          <p className="text-sm text-clay text-center">
            You will see <strong>{data.token.symbol}</strong> in your wallet on <strong>{destName}</strong>.
          </p>
        );
      case 'borrow':
        return (
          <p className="text-sm text-clay text-center">
            Funds sent to <strong>{destName}</strong>. Your debt is recorded on <strong>{sourceName}</strong>.
          </p>
        );
      case 'repay':
        return (
          <p className="text-sm text-clay text-center">
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
        <DialogHeader>
          <DialogTitle className="text-cherry-dark text-center">{currentConfig.title}</DialogTitle>
        </DialogHeader>

        {data && (
          <>
            <div className="bg-cream rounded-lg p-3 my-2 text-center">
              <p className="text-xs uppercase tracking-wider text-clay mb-1">{currentConfig.label}</p>
              <p className="text-2xl font-bold text-cherry-dark font-mono">
                {Number(data.amount).toFixed(4)} {data.token.symbol}
              </p>
            </div>

            {renderDescription()}
          </>
        )}

        <DialogFooter className="sm:justify-center">
          <Button variant="cherry" onClick={onClose} className="w-full">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
