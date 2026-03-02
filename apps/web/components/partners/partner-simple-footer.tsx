import { Label } from '@/components/ui/label';
import { FooterLink } from '@/components/landing/footer-link';
import Image from 'next/image';
import {
  BALANCED_DEFI_ROUTE,
  DISCORD_ROUTE,
  DOCUMENTATION_GITBOOK_ROUTE,
  GITHUB_ROUTE,
  HANA_WALLET_ROUTE,
  BRAND_KIT_ROUTE,
  LINKTREE_ROUTE,
  NEWS_ROUTE,
  SODAX_SCAN_ROUTE,
  SWAP_ROUTE,
  X_ROUTE,
} from '@/constants/routes';

export function PartnerSimpleFooter() {
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
          <FooterLink href={SWAP_ROUTE}>SODAX Swap</FooterLink>
          <FooterLink href={HANA_WALLET_ROUTE} showArrow>
            Hana Wallet
          </FooterLink>
          <FooterLink href={BALANCED_DEFI_ROUTE} showArrow>
            Balanced DeFi
          </FooterLink>
        </div>
        <div className="inline-flex flex-col justify-start items-start gap-3 w-[134px]">
          <div className="justify-start text-cherry-bright text-base font-normal font-['Shrikhand'] leading-[16px]">
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
        <div className="inline-flex flex-col justify-start items-start gap-3 w-[134px]">
          <div className="justify-start text-cherry-bright text-base font-normal font-['Shrikhand'] leading-[16px]">
            resources
          </div>
          <FooterLink href={DOCUMENTATION_GITBOOK_ROUTE} showArrow>
            Documentation
          </FooterLink>
          <FooterLink href={GITHUB_ROUTE} showArrow>
            GitHub
          </FooterLink>
          <FooterLink href={SODAX_SCAN_ROUTE} showArrow>
            SODAX Scan
          </FooterLink>
          <FooterLink href={BRAND_KIT_ROUTE} showArrowDown={true}>
            Brand Kit
          </FooterLink>
        </div>
      </div>
    </div>
  );
}
