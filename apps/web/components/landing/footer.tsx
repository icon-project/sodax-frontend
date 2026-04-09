'use client';

import { Label } from '@/components/ui/label';
import { FooterLink } from '@/components/landing/footer-link';
import Image from 'next/image';
import { useState } from 'react';
import TermsModal from '@/components/landing/terms-modal';
import {
  BALANCED_DEFI_ROUTE,
  BRAND_KIT_ROUTE,
  DISCORD_ROUTE,
  DOCUMENTATION_GITBOOK_ROUTE,
  EXCHANGE_ROUTE,
  GITHUB_ROUTE,
  GLOSSARY_ROUTE,
  HANA_WALLET_ROUTE,
  HOUDINI_SWAP_ROUTE,
  LINKTREE_ROUTE,
  NEWS_ROUTE,
  PARTNER_DASHBOARD_ROUTE,
  SODAX_SCAN_ROUTE,
  X_ROUTE,
} from '@/constants/routes';
import { showCookiePreferences } from '@/components/cookie-consent/cookie-consent-banner';

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
    <div className="h-140 flex flex-wrap-reverse sm:flex-wrap-reverse lg:justify-center bg-almost-white footer pt-20">
      <div className="p-4 pl-0 min-w-50 ml-8">
        <div className="flex items-center">
          <Image src="/symbol2.png" alt="SODAX Symbol" width={32} height={32} />
          <span className="ml-2 font-black text-2xl text-cherry-bright">SODAX</span>
        </div>
        <div>
          <Label className="text-[12px] font-[InterMedium] text-cherry-bright mt-5">
            © 2026 ICON Foundation. All rights reserved.
          </Label>
        </div>
      </div>
      <div className="sm:inline-flex sm:justify-start sm:items-start gap-10 p-4 ml-8 pl-0 flex flex-wrap lg:ml-27.75">
        <div className="inline-flex flex-col justify-start items-start gap-3 w-38">
          <div className="justify-start text-cherry-bright text-base font-normal font-['Shrikhand'] leading-4">
            using soda
          </div>
          <FooterLink href={EXCHANGE_ROUTE}>SODAX Exchange</FooterLink>{' '}
          <FooterLink href={HOUDINI_SWAP_ROUTE} showArrow>
            Houdini Swap{' '}
          </FooterLink>{' '}
          <FooterLink href={BALANCED_DEFI_ROUTE} showArrow>
            Balanced DeFi
          </FooterLink>{' '}
          <FooterLink href={HANA_WALLET_ROUTE} showArrow>
            Hana Wallet
          </FooterLink>
          <FooterLink href={PARTNER_DASHBOARD_ROUTE}>Partner Portal</FooterLink>
        </div>
        <div className="inline-flex flex-col justify-start items-start gap-3 w-33.5">
          <div className="justify-start text-cherry-bright text-base font-normal font-['Shrikhand'] leading-4">
            socials
          </div>
          <FooterLink href={NEWS_ROUTE}>News</FooterLink>
          <FooterLink href={DISCORD_ROUTE} showArrow>
            Discord
          </FooterLink>
          <FooterLink href={X_ROUTE} showArrow>
            X (Twitter)
          </FooterLink>
          <FooterLink href={LINKTREE_ROUTE} showArrow>
            Linktree
          </FooterLink>
        </div>
        <div className="inline-flex flex-col justify-start items-start gap-3 w-33.5">
          <div className="justify-start text-cherry-bright text-base font-normal font-['Shrikhand'] leading-4">
            resources
          </div>
          <FooterLink href={DOCUMENTATION_GITBOOK_ROUTE} showArrow>
            Documentation
          </FooterLink>
          <FooterLink href={GITHUB_ROUTE} showArrow>
            Github
          </FooterLink>
          <FooterLink href={SODAX_SCAN_ROUTE} showArrow>
            SODAX Scan
          </FooterLink>
          <FooterLink href={GLOSSARY_ROUTE}>Glossary</FooterLink>
          <FooterLink
            href={BRAND_KIT_ROUTE}
            showArrowDown={true}
            onClick={() => {
              const link = document.createElement('a');
              link.href = BRAND_KIT_ROUTE;
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
          <FooterLink
            href="#"
            onClick={e => {
              e.preventDefault();
              showCookiePreferences();
            }}
          >
            Cookie Settings
          </FooterLink>
        </div>
      </div>
      <TermsModal open={isTermsModalOpen} onOpenChange={setIsTermsModalOpen} />
    </div>
  );
};

export default Footer;
