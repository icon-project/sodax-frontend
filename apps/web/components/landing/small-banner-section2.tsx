import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

const SmallBannerSection2 = () => {
  return (
    <div className="flex flex-col lg:flex-row">
      <div className="w-full lg:w-1/2 flex flex-col items-center pt-14 md:pt-18 bg-cherry-soda  h-[440px] sm:h-[480px] md:h-[480px] mt-4 relative overflow-hidden">
        <Image
          className="mix-blend-screen absolute -bottom-22 left-1/2 transform -translate-x-1/2 w-[793px] max-w-[793px]"
          src="/banner3.png"
          alt="background"
          width={990}
          height={660}
        />
        <div className="flex items-center">
          <span className="text-yellow-soda text-(length:--app-title) font-bold font-['InterRegular'] leading-[1.1]">
            Harnessing growth
          </span>
        </div>
        <Label className="text-(length:--body-super-comfortable) font-[InterRegular] text-white leading-[1.4] mt-2 font-normal">
          to build liquidity and burn $SODA.
        </Label>
        <div className="mt-6 z-10">
          <Button
            className="rounded-full cursor-pointer"
            variant="subtle"
            size="lg"
            onClick={() => window.open('https://x.com/intent/user?screen_name=gosodax', '_blank')}
          >
            Follow us for launch
          </Button>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex flex-col items-center pt-14 md:pt-18 bg-cherry-soda  h-[440px] sm:h-[480px] md:h-[480px] mt-4 lg:ml-4 relative overflow-hidden">
        <Image
          className="mix-blend-screen absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[561px] sm:w-[561px] max-w-[561px]"
          src="/banner4.png"
          alt="background"
          width={990}
          height={660}
        />
        <div className="flex items-center">
          <Image src="/symbol.png" alt="SODAX Symbol" width={32} height={32} className="md:w-8 md:h-8 w-6 h-6" />
          <div className="flex flex-col">
            <span className="text-yellow-soda text-(length:--app-title) font-bold font-['InterRegular'] leading-[1.1] ml-2">
              Go cross-chain
            </span>
          </div>
        </div>
        <Label className="text-(length:--body-super-comfortable) font-[InterRegular] text-white leading-[1.4] mt-2 font-normal">
          Tap into the Unified Liquidity Layer
        </Label>
        <div className="mt-6 z-5">
          <Button
            className="rounded-full cursor-pointer"
            variant="subtle"
            size="lg"
            onClick={() => window.open('https://docs.sodax.com/', '_blank')}
          >
            Docs
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SmallBannerSection2;
