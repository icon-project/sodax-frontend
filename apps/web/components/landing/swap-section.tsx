import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRightIcon } from '../icons/arrow-right-icon';

const SwapSection = () => {
  const router = useRouter();

  return (
    <div className="h-[440px] sm:h-[480px] md:h-[560px] flex flex-col items-center bg-almost-white mt-4 pt-14 md:pt-18 relative section2">
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
          <span className="text-black text-(length:--main-title) font-normal font-['Shrikhand'] leading-[1.1]">
            swap
          </span>
          <span className="text-black text-(length:--main-title) font-bold font-['InterBlack'] leading-[1.1]">
            {' '}
            in seconds
          </span>
        </div>
      </div>
      <Label className="text-(length:--subtitle) font-[InterRegular] text-black mt-2 leading-[1.2]">
        The best rates to buy and sell.
      </Label>
      <div className="mt-6 z-5">
        <Button
          variant="outline"
          className="px-6 font-['InterMedium'] cursor-pointer text-(length:--body-comfortable)"
          size="lg"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => {
              router.push('/swap');
            }, 300);
          }}
        >
          Swap now
        </Button>
      </div>
      <ArrowRightIcon className="absolute bottom-[-48px] left-1/2 -translate-x-1/2 rotate-270" fill="#f8f3f3" />
    </div>
  );
};

export default SwapSection;
