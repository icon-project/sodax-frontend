import { Label } from '@/components/ui/label';
import { FooterLink } from '@/components/landing/footer-link';
import Image from 'next/image';

const Footer: React.FC = () => {
  return (
    <div className="h-[560px] flex flex-wrap-reverse sm:flex-wrap-reverse lg:justify-center mt-2 bg-almost-white footer pt-[80px]">
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
      <div className="sm:inline-flex sm:justify-end sm:items-start gap-10 p-4 ml-[32px] pl-0 flex flex-wrap lg:ml-[111px]">
        <div className="inline-flex flex-col justify-start items-start gap-3">
          <div className="justify-start text-cherry-bright text-base font-normal font-['Shrikhand'] leading-[16px]">
            using soda
          </div>
          <FooterLink href="#">Flagship Platform (Soon)</FooterLink>
          <FooterLink href="#" showArrow>
            Hana Wallet
          </FooterLink>
          <FooterLink href="#" showArrow>
            Balanced DeFi
          </FooterLink>
        </div>
        <div className="inline-flex flex-col justify-start items-start gap-3">
          <div className="justify-start text-cherry-bright text-base font-normal font-['Shrikhand'] leading-[16px]">
            socials
          </div>
          <FooterLink href="#">Blog</FooterLink>
          <FooterLink href="#" showArrow>
            Discord
          </FooterLink>
          <FooterLink href="#" showArrow>
            X (Twitter)
          </FooterLink>
          <FooterLink href="#" showArrow>
            Linktree
          </FooterLink>
        </div>
        <div className="inline-flex flex-col justify-start items-start gap-3">
          <div className="justify-start text-cherry-bright text-base font-normal font-['Shrikhand'] leading-[16px]">
            resources
          </div>
          <FooterLink href="#" showArrow>
            Partners
          </FooterLink>
          <FooterLink href="#">Contact Us</FooterLink>
          <FooterLink href="#">Media Kit</FooterLink>
          <FooterLink href="#">Disclaimer</FooterLink>
          <FooterLink href="#">Terms & Conditions</FooterLink>
        </div>
        <div className="inline-flex flex-col justify-start items-start gap-3">
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
        </div>
      </div>
    </div>
  );
};

export default Footer;
