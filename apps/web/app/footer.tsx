import { Label } from '@/components/ui/label';
import Image from 'next/image';
import Link from 'next/link';

const Footer = () => {
  return (
    <div className="h-[560px] flex flex-wrap-reverse sm:flex-wrap-reverse lg:justify-center mt-2 bg-Almost-white footer pt-[80px]">
      <div className="p-4 pl-0 min-w-[200px] ml-[32px]">
        <div className="flex items-center">
          <Image
            src="/symbol2.png"
            alt="SODAX Symbol"
            width={32}
            height={32}
          />
          <span className="ml-2 font-black text-2xl text-Cherry-bright">SODAX</span>
        </div>
        <div>
          <Label className="text-[12px] font-[InterMedium] text-Cherry-bright mt-5">
            © 2025 ICON Foundation. All rights reserved.
          </Label>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 ml-[32px] font-['InterMedium']">
        <div className="list">
          <Label className="font-[Shrikhand] text-[16px] text-Cherry-bright">using soda</Label>
          <ul className="text-xs grid gap-y-1.5">
            <Link href="/dashboard">Flagship Platform (Soon)</Link>
            <Link href="/dashboard">Hana Wallet</Link>
            <Link href="/dashboard">Balanced DeFi</Link>
          </ul>
        </div>
        <div className="list">
          <Label className="font-[Shrikhand] text-[16px] text-Cherry-bright">socials</Label>
          <ul className="text-xs grid gap-y-1.5">
            <Link href="/dashboard">Blog</Link>
            <Link href="/dashboard">Discord</Link>
            <Link href="/dashboard">X (Twitter)</Link>
            <Link href="/dashboard">Linktree</Link>
          </ul>
        </div>
        <div className="list">
          <Label className="font-[Shrikhand] text-[16px] text-Cherry-bright">resources</Label>
          <ul className="text-xs grid gap-y-1.5">
            <Link href="/dashboard" className="justify-start text-black text-xs">Business Development</Link>
            <Link href="/dashboard">Contact Us</Link>
            <Link href="/dashboard">Media Kit</Link>
            <Link href="/dashboard">Disclaimer</Link>
            <Link href="/dashboard">Terms & Conditions</Link>
          </ul>
        </div>
        <div className="list">
          <Label className="font-[Shrikhand] text-[16px] text-Cherry-bright">more</Label>
          <ul className="text-xs grid gap-y-1.5">
            <Link href="/dashboard">CMC</Link>
            <Link href="/dashboard">Binance Square</Link>
            <Link href="/dashboard">DefiLlama</Link>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Footer;
