'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getChainExplorerTxUrl } from '@/lib/utils';
import { Copy, ExternalLink, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { getChainName } from '@/constants/chains';
import { SONIC_MAINNET_CHAIN_ID } from '@sodax/types';

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
  const txUrl = srcTxHash ? getChainExplorerTxUrl(SONIC_MAINNET_CHAIN_ID, srcTxHash) : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-cherry-grey/20" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="text-cherry-dark text-center flex items-center justify-center gap-2">
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            Claim Submitted!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex flex-col items-center py-2">
            <p className="text-sm text-clay text-center">
              Your claim is being processed and funds will appear on
              <strong className="mx-1">
                {destination?.chain ? getChainName(destination.chain) : 'your destination chain'}
              </strong>
              shortly.
            </p>
          </div>

          {/* Transaction details */}
          {srcTxHash && (
            <div className="rounded-lg bg-cream-white border border-cherry-grey p-4 space-y-3">
              <div className="space-y-1.5">
                <p className="text-xs text-clay-light uppercase tracking-wide font-semibold">Transaction Hash</p>
                <div className="flex items-center justify-start gap-2">
                  <span className="font-mono text-xs text-clay whitespace-nowrap">
                    {srcTxHash.slice(0, 12)}...{srcTxHash.slice(-12)}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(srcTxHash);
                      toast.success('Hash copied!');
                    }}
                    className="shrink-0 p-1.5 rounded hover:bg-cherry/10 text-clay-light hover:text-cherry transition"
                    title="Copy hash"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* View on explorer button */}
              {txUrl && (
                <a
                  href={txUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-lg bg-cream-grey/40 px-4 py-2.5 text-sm text-espresso font-medium hover:bg-cream-grey/60 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on explorer
                </a>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button variant="cherry" className="w-full" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>

        <p className="text-xs text-clay-light text-center -mt-2">You can safely close this window</p>
      </DialogContent>
    </Dialog>
  );
}
