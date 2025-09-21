import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const Section3 = () => {
  return (
    <div className="h-[440px] sm:h-[480px] md:h-[560px] flex flex-col items-center bg-almost-white mt-4 pt-[40px] sm:pt-[60px] relative overflow-hidden bg-[url('/section2-1.png')] bg-no-repeat bg-bottom section3">
      <img
        className="mix-blend-multiply absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[660px] md:w-[850px] max-w-[850px] z-0"
        src="/section2.png"
        alt="background"
        width={850}
        height={660}
      />
      <div className="flex items-center">
        <img src="/symbol_dark.png" alt="SODAX Symbol" width={32} height={32} />
        <div className="text-center justify-center ml-5">
          <span className="text-Black text-[24px] md:text-5xl font-normal font-['Shrikhand'] leading-10">swap</span>
          <span className="text-Black text-[24px] md:text-5xl font-black font-['InterBlack'] leading-10">
            {' '}
            anywhere
          </span>
        </div>
      </div>
      <Label className="text-xs sm:text-[18px] font-[InterRegular] text-espresso mt-3">
        Assets for all tastes. Solved at leading rates.
      </Label>
      <div className="mt-4 z-10">
        <Button
          variant="outline"
          className="px-6 font-['InterMedium'] cursor-pointer"
          size="lg"
          onClick={() => window.open('https://x.com/gosodax', '_blank')}
        >
          Follow X for launch
        </Button>
      </div>
    </div>
  );
};

export default Section3;
