import { Label } from '@/components/ui/label';
import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

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
          <div className="group justify-start text-black text-[13px] font-medium font-['InterMedium'] leading-[16px] group-hover:text-cherry-bright group-hover:font-bold cursor-pointer">
            Flagship Platform (Soon)
          </div>
          <div className="group inline-flex justify-start items-start gap-3 cursor-pointer">
            <div className="justify-start text-black text-[13px] font-medium font-['InterMedium'] leading-[16px] group-hover:text-cherry-bright group-hover:font-bold">
              Hana Wallet
            </div>
            <ArrowUpRight width={16} height={16} className="text-cherry-bright group-hover:stroke-[3.5]" />
          </div>
          <div className="group inline-flex justify-start items-start gap-3 cursor-pointer">
            <div className="justify-start text-black text-[13px] font-medium font-['InterMedium'] leading-[16px] group-hover:text-cherry-bright group-hover:font-bold">
              Balanced DeFi
            </div>
            <ArrowUpRight width={16} height={16} className="text-cherry-bright group-hover:stroke-[3.5]" />
          </div>
        </div>
        <div className="inline-flex flex-col justify-start items-start gap-3">
          <div className="justify-start text-cherry-bright text-base font-normal font-['Shrikhand'] leading-[16px]">
            socials
          </div>
          <div className="group justify-start text-black text-[13px] font-medium font-['InterMedium'] leading-[16px] group-hover:text-cherry-bright group-hover:font-bold cursor-pointer">
            Blog
          </div>
          <div className="group inline-flex justify-start items-start gap-3 cursor-pointer">
            <div className="justify-start text-black text-[13px] font-medium font-['InterMedium'] leading-[16px] group-hover:text-cherry-bright group-hover:font-bold">
              Discord
            </div>
            <ArrowUpRight width={16} height={16} className="text-cherry-bright group-hover:stroke-[3.5]" />
          </div>
          <div className="group inline-flex justify-start items-start gap-3 cursor-pointer">
            <div className="justify-start text-black text-[13px] font-medium font-['InterMedium'] leading-[16px] group-hover:text-cherry-bright group-hover:font-bold">
              X (Twitter)
            </div>
            <ArrowUpRight width={16} height={16} className="text-cherry-bright group-hover:stroke-[3.5]" />
          </div>
          <div className="group inline-flex justify-start items-start gap-3 cursor-pointer">
            <div className="justify-start text-black text-[13px] font-medium font-['InterMedium'] leading-[16px] group-hover:text-cherry-bright group-hover:font-bold">
              Linktree
            </div>
            <ArrowUpRight width={16} height={16} className="text-cherry-bright group-hover:stroke-[3.5]" />
          </div>
        </div>
        <div className="inline-flex flex-col justify-start items-start gap-3">
          <div className="justify-start text-cherry-bright text-base font-normal font-['Shrikhand'] leading-[16px]">
            resources
          </div>
          <div className="group inline-flex justify-start items-start gap-3 cursor-pointer">
            <div className="justify-start text-black text-[13px] font-medium font-['InterMedium'] leading-[16px] group-hover:text-cherry-bright group-hover:font-bold">
              Partners
            </div>
            <ArrowUpRight width={16} height={16} className="text-cherry-bright group-hover:stroke-[3.5]" />
          </div>
          <div className="group justify-start text-black text-[13px] font-medium font-['InterMedium'] leading-[16px] group-hover:text-cherry-bright group-hover:font-bold cursor-pointer">
            Contact Us
          </div>
          <div className="group justify-start text-black text-[13px] font-medium font-['InterMedium'] leading-[16px] group-hover:text-cherry-bright group-hover:font-bold cursor-pointer">
            Media Kit
          </div>
          <div className="group justify-start text-black text-[13px] font-medium font-['InterMedium'] leading-[16px] group-hover:text-cherry-bright group-hover:font-bold cursor-pointer">
            Disclaimer
          </div>
          <div className="group justify-start text-black text-[13px] font-medium font-['InterMedium'] leading-[16px] group-hover:text-cherry-bright group-hover:font-bold cursor-pointer">
            Terms & Conditions
          </div>
        </div>
        <div className="inline-flex flex-col justify-start items-start gap-3">
          <div className="justify-start text-cherry-bright text-base font-normal font-['Shrikhand'] leading-[16px]">
            more
          </div>
          <div className="group inline-flex justify-start items-start gap-3 cursor-pointer">
            <div className="justify-start text-black text-[13px] font-medium font-['InterMedium'] leading-[16px] group-hover:text-cherry-bright group-hover:font-bold">
              CMC
            </div>
            <ArrowUpRight width={16} height={16} className="text-cherry-bright group-hover:stroke-[3.5]" />
          </div>
          <div className="group inline-flex justify-start items-start gap-3 cursor-pointer">
            <div className="justify-start text-black text-[13px] font-medium font-['InterMedium'] leading-[16px] group-hover:text-cherry-bright group-hover:font-bold">
              Binance Square
            </div>
            <ArrowUpRight width={16} height={16} className="text-cherry-bright group-hover:stroke-[3.5]" />
          </div>
          <div className="group inline-flex justify-start items-start gap-3 cursor-pointer">
            <div className="justify-start text-black text-[13px] font-medium font-['InterMedium'] leading-[16px] group-hover:text-cherry-bright group-hover:font-bold">
              DefiLlama
            </div>
            <ArrowUpRight width={16} height={16} className="text-cherry-bright group-hover:stroke-[3.5]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
