import { Label } from '@/components/ui/label';
import { FooterLink } from '@/components/landing/footer-link';
import Image from 'next/image';
import { useState } from 'react';
import TermsModal from '@/components/landing/terms-modal';

interface FooterProps {
  onTermsClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onTermsClick }) => {
  const [isTermsModalOpen, setIsTermsModalOpen] = useState<boolean>(false);

  const handleTermsClick = () => {
    setIsTermsModalOpen(true);
    onTermsClick?.();
  };
  return (
    <div className="h-[560px] flex flex-wrap-reverse sm:flex-wrap-reverse lg:justify-center mt-4 bg-almost-white footer pt-[80px]">
      <div className="p-4 pl-0 min-w-[200px] ml-[32px]">
        <div className="flex items-center">
          <Image src="/symbol2.png" alt="SODAX Symbol" width={32} height={32} />
          <span className="ml-2 font-black text-2xl text-cherry-bright">SODAX</span>
        </div>
        <div>
          <Label className="text-[12px] font-[InterMedium] text-cherry-bright mt-5">
            © 2025 ICON Foundation. All rights reserved.
          </Label>
        </div>
      </div>
      <div className="sm:inline-flex sm:justify-start sm:items-start gap-10 p-4 ml-[32px] pl-0 flex flex-wrap lg:ml-[111px]">
        <div className="inline-flex flex-col justify-start items-start gap-3 w-[152px]">
          <div className="justify-start text-cherry-bright text-base font-normal font-['Shrikhand'] leading-[16px]">
            using soda
          </div>
          <FooterLink href="#">Flagship Platform (Soon)</FooterLink>
          <FooterLink href="https://www.hanawallet.io/" showArrow>
            Hana Wallet
          </FooterLink>
          <FooterLink href="https://app.balanced.network/" showArrow>
            Balanced DeFi
          </FooterLink>
        </div>
        <div className="inline-flex flex-col justify-start items-start gap-3 w-[134px]">
          <div className="justify-start text-cherry-bright text-base font-normal font-['Shrikhand'] leading-[16px]">
            socials
          </div>
          <FooterLink href="https://news.sodax.com/">News</FooterLink>
          <FooterLink href="https://discord.gg/xM2Nh4S6vN" showArrow>
            Discord
          </FooterLink>
          <FooterLink href="https://x.com/gosodax" showArrow>
            X (Twitter)
          </FooterLink>
          <FooterLink href="https://linktr.ee/go.sodax" showArrow>
            Linktree
          </FooterLink>
        </div>
        <div className="inline-flex flex-col justify-start items-start gap-3 w-[134px]">
          <div className="justify-start text-cherry-bright text-base font-normal font-['Shrikhand'] leading-[16px]">
            resources
          </div>
          <FooterLink href="https://sodax.gitbook.io/sodax/readme-1" showArrow>
            Gitbook
          </FooterLink>
          <FooterLink href="https://github.com/icon-project/sodax-frontend">Frontend Github</FooterLink>
          <FooterLink href="https://www.figma.com/design/lZi3whUFdj24pQnYDOkIee/SODAX-Brand-guide?node-id=0-1&t=FzVNlqCMO4D36P36-1">
            Media Kit
          </FooterLink>
          <FooterLink href="#" onClick={handleTermsClick}>
            Terms
          </FooterLink>
        </div>
        {/* <div className="inline-flex flex-col justify-start items-start gap-3 w-[134px]">
          <div className="justify-start text-cherry-bright text-base font-normal font-['Shrikhand'] leading-[16px]">
            more
          </div>
          <FooterLink href="#" showArrow>
            CMC
          </FooterLink>
          <FooterLink href="#" showArrow>
            Binance Square
          </FooterLink>
          <FooterLink href="#" showArrow>
            DefiLlama
          </FooterLink>
        </div> */}
      </div>
      <TermsModal open={isTermsModalOpen} onOpenChange={setIsTermsModalOpen} />
    </div>
  );
};

export default Footer;
