import type React from 'react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { MODAL_ID } from '@/stores/modal-store';
import { useModalOpen } from '@/stores/modal-store-provider';
import { useModalStore } from '@/stores/modal-store-provider';
import { useXAccount, useXDisconnect, useXSignMessage } from '@sodax/wallet-sdk-react';
import type { ChainType } from '@sodax/types';
import { TermsContent } from './terms-content';
import { Loader2 } from 'lucide-react';
import { registerUser } from '@/apis/users';
import { ScrollAreaPrimitive, ScrollBar } from '@/components/ui/scroll-area';

interface TermsConfirmationModalProps {
  modalId?: MODAL_ID;
}

const TermsConfirmationModal: React.FC<TermsConfirmationModalProps> = ({
  modalId = MODAL_ID.TERMS_CONFIRMATION_MODAL,
}) => {
  const [isPending, setIsPending] = useState<boolean>(false);
  const open = useModalOpen(modalId);
  const closeModal = useModalStore(state => state.closeModal);
  // const openModal = useModalStore(state => state.openModal);
  const modalData = useModalStore(state => state.modals[modalId]?.modalData) as { chainType: ChainType } | undefined;
  const xDisconnect = useXDisconnect();

  const xAccount = useXAccount(modalData?.chainType);

  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [isTermsExpanded, setIsTermsExpanded] = useState<boolean>(false);

  const { mutateAsync: signMessage } = useXSignMessage();

  const handleAccept = async (): Promise<void> => {
    if (acceptedTerms && modalData?.chainType) {
      // openModal(MODAL_ID.WALLET_MODAL);
      // if (typeof window !== 'undefined') localStorage.setItem('acceptedTerms', 'accepted');

      try {
        const message = `By signing this I confirm that I have read and I agree to the terms of service and legal disclaimer provided by Sodax on ${new Date()}`;
        setIsPending(true);
        const signature = await signMessage({
          xChainType: modalData?.chainType,
          message,
        });

        await registerUser({
          address: xAccount?.address as string,
          signature: signature as string,
          chainType: modalData?.chainType,
          message,
        });
        setIsPending(false);
        closeModal(modalId);
        setAcceptedTerms(false);
      } catch (e) {
        console.log(e);
        setIsPending(false);
      }
    }
  };

  const disconnectWallet = async (): Promise<void> => {
    closeModal(modalId);
    if (modalData?.chainType) {
      xDisconnect(modalData.chainType);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => closeModal(modalId)}>
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
              <Image src="/symbol_dark.png" alt="SODAX Symbol" width={16} height={16} className="mix-blend-multiply" />
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
          <ScrollAreaPrimitive.Root>
            <ScrollAreaPrimitive.Viewport className="text-(length:--body-comfortable) text-clay font-['InterRegular'] leading-relaxed h-[100px] md:h-[380px] pr-2 pb-5">
              <TermsContent />
              <ScrollBar className="w-2" />
            </ScrollAreaPrimitive.Viewport>
          </ScrollAreaPrimitive.Root>
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-vibrant-white to-transparent pointer-events-none"></div>
        </div>

        <div className="flex gap-2 z-60">
          <Button
            variant="cherry"
            onClick={handleAccept}
            disabled={!acceptedTerms}
            className="bg-cherry-bright hover:bg-cherry-brighter disabled:bg-cherry-grey disabled:cursor-not-allowed lg:max-w-[240px] md:max-w-[240px] h-10 font-['InterRegular'] cursor-pointer w-[200px]"
          >
            {isPending ? 'Accepting terms...' : 'Accept terms'}
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
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
  );
};

export default TermsConfirmationModal;
