'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getChainExplorerTxUrl } from '@/lib/utils';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface ClaimSubmittedModalProps {
  isOpen: boolean;
  onClose: () => void;
  destination?: {
    chain: string;
    address: string;
  };
  srcTxHash?: `0x${string}` | null;
}

export function ClaimSubmittedModal({ isOpen, onClose, destination, srcTxHash }: ClaimSubmittedModalProps) {
  const txUrl = srcTxHash && destination?.chain ? getChainExplorerTxUrl(destination.chain, srcTxHash) : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-cherry-grey/20 text-center" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="text-cherry-dark text-center">Claim request submitted</DialogTitle>
        </DialogHeader>

        <div className="text-sm text-clay">
          <div className="space-y-2 text-sm text-clay">
            <p className="font-clay">Funds will appear on the destination chain shortly.</p>
          </div>

          {srcTxHash && (
            <div className="mt-2 rounded-lg bg-cream-white/60 border border-cherry-grey/40 px-4 py-3 text-left">
              <div className="mt-2 text-[11px] text-clay-light font-mono flex items-center gap-2">
                <span>
                  Transaction hash: {srcTxHash.slice(0, 19)}…{srcTxHash.slice(-16)}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(srcTxHash);
                    toast.success('Transaction hash copied to clipboard');
                  }}
                  className="flex items-center gap-1 text-clay-light hover:text-cherry transition hover:cursor-pointer"
                  title="Copy transaction hash"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              {txUrl && (
                <a
                  href={txUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-cherry/10 px-3 py-2 text-cherry font-medium hover:bg-cherry/15 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on explorer
                </a>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="cherry" className="w-full" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
