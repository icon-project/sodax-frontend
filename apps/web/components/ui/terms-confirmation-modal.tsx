import type React from 'react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import { WalletModal } from '@/components/shared/wallet-modal';
import { ArrowRight } from 'lucide-react';

interface TermsConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
}

const TermsConfirmationModal: React.FC<TermsConfirmationModalProps> = ({ open, onOpenChange, onAccept }) => {
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);

  const handleAccept = (): void => {
    if (acceptedTerms) {
      setShowWalletModal(true);
      onOpenChange(false);
      setAcceptedTerms(false); // Reset for next time
    }
  };

  const handleClose = (): void => {
    onOpenChange(false);
    setAcceptedTerms(false); // Reset for next time
  };

  const handleWalletModalDismiss = (): void => {
    setShowWalletModal(false);
    onAccept(); // Call the original onAccept callback
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-full h-[calc(100vh-205px)] sm:h-fit md:max-w-[480px] shadow-none bg-white py-22 md:py-10 px-12 gap-6 fixed bottom-0 left-0 right-0 top-auto translate-y-0 translate-x-0 sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] rounded-t-[32px] rounded-b-[0px] sm:rounded-[32px] flex flex-col">
          <DialogTitle>
            <div className="inline-flex justify-start items-center gap-2">
              <Image src="/symbol.png" alt="SODAX Symbol" width={24} height={24} />
              <div className="mix-blend-multiply justify-end text-espresso font-['InterBold'] leading-snug text-(size:--subtitle)">
                Confirm terms
              </div>
            </div>
          </DialogTitle>

          <div className="text-clay-light">
            <p className="font-['InterRegular'] font-medium leading-[1.4] text-(size:--body-comfortable)">
              SODAX is a decentralized, non-custodial DeFi platform. By connecting to SODAX, you agree to the following
              terms.
            </p>
          </div>

          <div className="flex gap-2 items-center">
            <Checkbox
              id="accept-terms"
              checked={acceptedTerms}
              onCheckedChange={checked => setAcceptedTerms(checked as boolean)}
            />
            <label htmlFor="accept-terms" className="text-sm text-espresso cursor-pointer font-['InterRegular']">
              Accept{' '}
              <button type="button" className="underline hover:text-cherry-brighter transition-colors">
                terms and conditions
              </button>
            </label>
          </div>

          <div className="flex">
            <Button
              variant="cherry"
              onClick={handleAccept}
              disabled={!acceptedTerms}
              className="flex-1 bg-cherry-bright hover:bg-cherry-brighter disabled:bg-cherry-grey disabled:cursor-not-allowed lg:max-w-[197px] md:max-w-[188px] h-10 font-['InterRegular']"
            >
              Continue to wallets
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <WalletModal isOpen={showWalletModal} onDismiss={handleWalletModalDismiss} />
    </>
  );
};

export default TermsConfirmationModal;
