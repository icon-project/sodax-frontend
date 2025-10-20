import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

const SmallBannerSection1 = () => {
  return (
    <div className="flex flex-col lg:flex-row">
      <div className="w-full lg:w-1/2 flex flex-col items-center pt-14 md:pt-18 bg-almost-white h-[440px] sm:h-[480px] md:h-[480px] mt-4 lg:mr-4 relative z-1">
        <Image
          className="mix-blend-multiply absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[632px] md:w-[765px] max-w-[765px] z-0"
          src="/banner1.png"
          alt="background"
          width={850}
          height={660}
        />
        <div className="flex items-center gap-4">
          <Image src="/symbol_dark.png" alt="SODAX Symbol" width={32} height={32} className="md:w-8 md:h-8 w-6 h-6" />
          <div className="text-center justify-center">
            <span className="text-black text-(length:--app-title) font-normal font-['Shrikhand'] leading-[1.1]">
              swap
            </span>
            <span className="text-black text-(length:--app-title) font-bold font-['InterRegular'] leading-[1.1]">
              {' '}
              in seconds
            </span>
          </div>
        </div>
        <Label className="text-(length:--body-super-comfortable) font-[InterRegular] text-black mt-2 leading-[1.2]">
          The best rates to buy and sell.
        </Label>
        <div className="mt-6 z-5">
          <Button
            variant="outline"
            className="px-6 font-['InterMedium'] cursor-pointer text-(length:--body-comfortable)"
            size="lg"
            onClick={() => window.open('https://x.com/intent/user?screen_name=gosodax', '_blank')}
          >
            Follow us for launch
          </Button>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex flex-col items-center pt-14 md:pt-18 h-[440px] sm:h-[480px] md:h-[480px] mt-4 bg-almost-white relative z-1 overflow-hidden">
        <Image
          className="mix-blend-multiply absolute bottom-[-280px] left-1/2 transform -translate-x-1/2 w-[737px] z-2"
          src="/circle1.png"
          alt="background"
          width={737}
          height={737}
        />
        <Image
          className="mix-blend-multiply absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[848px] max-w-[848px] z-3"
          src="/banner2.png"
          alt="background"
          width={848}
          height={565}
        />
        <div className="flex items-center gap-4">
          <Image src="/symbol_dark.png" alt="SODAX Symbol" width={32} height={32} className="md:w-8 md:h-8 w-6 h-6" />
          <div className="text-center justify-center">
            <span className="text-black text-(length:--app-title) font-normal font-['Shrikhand'] leading-[1.1]">
              save
            </span>
            <span className="text-black text-(length:--app-title) font-bold font-['InterRegular'] leading-[1.1]">
              {' '}
              with flexibility
            </span>
          </div>
        </div>
        <Label className="text-(length:--body-super-comfortable) font-[InterRegular] text-black mt-2 leading-[1.2]">
          Earn across your crypto assets.
        </Label>
        <div className="mt-6 z-5">
          <Button
            variant="outline"
            className="px-6 font-['InterMedium'] cursor-pointer text-(length:--body-comfortable)"
            size="lg"
            onClick={() => window.open('https://x.com/intent/user?screen_name=gosodax', '_blank')}
          >
            Follow us for launch
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SmallBannerSection1;
