import type React from 'react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import { WalletModal } from '@/components/shared/wallet-modal';
import { ArrowRight } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface TermsConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void | Promise<void>;
  onDisconnect: () => void | Promise<void>;
  walletName?: string;
}

const TermsConfirmationModal: React.FC<TermsConfirmationModalProps> = ({
  open,
  onOpenChange,
  onAccept,
  onDisconnect,
  walletName,
}) => {
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [isTermsExpanded, setIsTermsExpanded] = useState<boolean>(false);

  const handleAccept = async (): Promise<void> => {
    if (acceptedTerms) {
      await onAccept();
      setAcceptedTerms(false); // Reset for next time
    }
  };

  const handleClose = (): void => {
    onOpenChange(false);
    setAcceptedTerms(false); // Reset for next time
  };

  const handleWalletModalDismiss = async (): Promise<void> => {
    setShowWalletModal(false);
    await onAccept(); // Call the original onAccept callback
  };

  const disconnectWallet = async (): Promise<void> => {
    await onDisconnect();
    handleClose();
  };

  // Default button text if no wallet name is provided
  const buttonText = walletName ? `Wallet sign-in ${walletName}` : 'Continue to wallets';

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="gap-0 max-w-full h-[calc(100vh-205px)] sm:h-fit md:max-w-[480px] shadow-none bg-vibrant-white py-22 md:py-10 px-12 fixed bottom-0 left-0 right-0 top-auto translate-y-0 translate-x-0 sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] rounded-t-[32px] rounded-b-[0px] sm:rounded-[32px] flex flex-col"
          hideCloseButton
          onInteractOutside={e => {
            e.preventDefault();
          }}
        >
          <DialogTitle>
            <div className="flex flex-row justify-between items-center">
              <div className="inline-flex justify-start items-center gap-2">
                <Image
                  src="/symbol_dark.png"
                  alt="SODAX Symbol"
                  width={16}
                  height={16}
                  className="mix-blend-multiply"
                />
                <div className="mix-blend-multiply justify-end text-espresso font-['InterBold'] leading-snug text-(length:--subtitle)">
                  Confirm terms
                </div>
              </div>
            </div>
          </DialogTitle>

          <div className="text-clay-light mt-6">
            <p className="font-['InterRegular'] font-medium leading-[1.4] text-(length:--body-comfortable)">
              SODAX is a decentralized, non-custodial DeFi platform. By connecting to SODAX, you agree to the following
              terms.
            </p>
          </div>

          <div className="flex gap-2 items-center mt-6">
            <Checkbox
              id="accept-terms"
              checked={acceptedTerms}
              onCheckedChange={checked => setAcceptedTerms(checked as boolean)}
            />
            <label
              htmlFor="accept-terms"
              className="text-sm text-espresso cursor-pointer font-['InterRegular'] inline-flex items-center gap-1"
            >
              Accept{' '}
              <button
                type="button"
                className="underline hover:text-cherry-brighter transition-colors flex items-center gap-1 cursor-pointer"
                onClick={() => setIsTermsExpanded(!isTermsExpanded)}
              >
                terms and conditions
              </button>
            </label>
          </div>

          <div
            className={`transition-all duration-300 ease-in-out relative ${
              isTermsExpanded ? 'max-h-96 opacity-100 mt-6 mb-6' : 'max-h-0 opacity-0 mt-6'
            }`}
          >
            <ScrollArea className="text-(length:--body-comfortable) text-clay font-['InterRegular'] leading-relaxed h-[100px] md:h-[380px] pr-2">
              <p className="mb-3">Use the same terms present in the landing page please.</p>
              <p className="mb-3">
                This is randomly generated text. By accessing or using this Web3 DeFi platform ("the Service"), you
                acknowledge and agree that all interactions are decentralized and performed at your own risk. The
                Service operates through smart contracts on public blockchains, with no central authority or user fund
                custody. Users are fully responsible for managing their own wallets, private keys, and transaction
                decisions. Any irreversible loss of access or funds due to user error or technical failure is solely the
                user's responsibility.
              </p>
              <p className="mb-3">
                This Service is provided "as is" without warranties, express or implied. We disclaim liability for any
                issues arising from code exploits, network outages, or integration failures. You accept that
                participation involves significant financial risk, including potential total loss of digital assets. No
                guarantees are made regarding functionality, uptime, or financial returns. Continued use constitutes
                acceptance of these conditions and acknowledgment that you understand and assume all associated risks.
              </p>
              <ScrollBar className="w-1" />
            </ScrollArea>
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-vibrant-white to-transparent pointer-events-none"></div>
          </div>

          <div className="flex gap-2 z-60">
            <Button
              variant="cherry"
              onClick={handleAccept}
              disabled={!acceptedTerms}
              className="bg-cherry-bright hover:bg-cherry-brighter disabled:bg-cherry-grey disabled:cursor-not-allowed lg:max-w-[197px] md:max-w-[188px] h-10 font-['InterRegular'] cursor-pointer w-38"
            >
              Accept terms
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={disconnectWallet}
              className="h-10 font-['InterRegular'] cursor-pointer w-30 outline-cherry-grey text-espresso"
            >
              Disconnect
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <WalletModal isOpen={showWalletModal} onDismiss={handleWalletModalDismiss} />
    </>
  );
};

export default TermsConfirmationModal;
