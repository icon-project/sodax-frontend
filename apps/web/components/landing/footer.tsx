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
    <div className="h-140 flex flex-wrap-reverse sm:flex-wrap-reverse lg:justify-center mt-4 bg-almost-white footer pt-20">
      <div className="p-4 pl-0 min-w-50 ml-8">
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
      <div className="sm:inline-flex sm:justify-start sm:items-start gap-10 p-4 ml-8 pl-0 flex flex-wrap lg:ml-27.75">
        <div className="inline-flex flex-col justify-start items-start gap-3 w-38">
          <div className="justify-start text-cherry-bright text-base font-normal font-['Shrikhand'] leading-4">
            using soda
          </div>
          <FooterLink href="/swap">SODAX Swap</FooterLink>
          <FooterLink href="https://www.hanawallet.io/" showArrow>
            Hana Wallet
          </FooterLink>
          <FooterLink href="https://app.balanced.network/" showArrow>
            Balanced DeFi
          </FooterLink>
          <FooterLink href="/partner">
            <div className="justify-start text-cherry-bright text-base font-normal font-['Shrikhand'] leading-4">
              partner portal
            </div>
          </FooterLink>
        </div>
        <div className="inline-flex flex-col justify-start items-start gap-3 w-33.5">
          <div className="justify-start text-cherry-bright text-base font-normal font-['Shrikhand'] leading-4">
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
        <div className="inline-flex flex-col justify-start items-start gap-3 w-33.5">
          <div className="justify-start text-cherry-bright text-base font-normal font-['Shrikhand'] leading-4">
            resources
          </div>
          <FooterLink href="https://sodax-1.gitbook.io/sodax-docs/readme-1" showArrow>
            Documentation
          </FooterLink>
          <FooterLink href="https://github.com/icon-project/sodax-frontend" showArrow>
            Github
          </FooterLink>
          <FooterLink href="https://sodaxscan.com/" showArrow>
            SODAX Scan
          </FooterLink>
          <FooterLink
            href="/SODAX.logos.and.token.zip"
            showArrowDown={true}
            onClick={() => {
              const link = document.createElement('a');
              link.href = '/SODAX.logos.and.token.zip';
              link.download = 'SODAX.logos.and.token.zip';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            Brand Kit
          </FooterLink>
          <FooterLink href="#" onClick={handleTermsClick}>
            Terms
          </FooterLink>
        </div>
      </div>
      <TermsModal open={isTermsModalOpen} onOpenChange={setIsTermsModalOpen} />
    </div>
  );
};

export default Footer;
