import type React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Image from 'next/image';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { TermsContent } from '@/components/shared/wallet-modal/terms-content';

interface TermsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[80vh] w-[90%] lg:max-w-[952px] shadow-none">
        <div className="flex items-start mb-6 mt-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-2 text-white hover:text-yellow-soda transition-colors"
          ></button>
          <Image src="/symbol.png" alt="SODAX Symbol" width={24} height={24} className="mr-2" />
          <div className="text-center text-black text-lg font-['InterBold'] leading-snug">Terms and conditions</div>
        </div>

        <div className="flex shadow-none">
          <ScrollArea className="bg-white text-black max-h-[60vh]">
            <TermsContent />
            <ScrollBar className="w-1" />
          </ScrollArea>
          {/* Fade out effect at the bottom */}
          <div className="absolute bottom-12 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none rounded-lg"></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TermsModal;
