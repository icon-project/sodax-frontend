import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

const Section2 = () => {
  return (
    <div className="h-[440px] sm:h-[480px] md:h-[560px] flex flex-col items-center bg-almost-white mt-2 pt-[40px] sm:pt-[60px] relative overflow-hidden section2">
      <Image
        className="mix-blend-multiply absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[859px] opacity-[0.7] z-0"
        src="/section1-1.png"
        alt="background"
        width={990}
        height={660}
      />
      <Image
        className="mix-blend-multiply absolute bottom-[-24px] left-1/2 transform -translate-x-1/2 w-[394px] md:w-[502px] max-w-[502px] z-0"
        src="/section1.png"
        alt="background"
        width={990}
        height={660}
      />
      <div className="flex items-center">
        <Image src="/symbol_dark.png" alt="SODAX Symbol" width={32} height={32} />
        <div className="text-center justify-center ml-5">
          <span className="text-Black text-[24px] md:text-[42px] font-normal font-['Shrikhand'] leading-[1.1]">
            borrow
          </span>
          <span className="text-Black text-[24px] md:text-[42px] font-black font-['InterBlack'] leading-[1.1]">
            {' '}
            on tap
          </span>
        </div>
      </div>
      <Label className="text-xs sm:text-[18px] font-[InterRegular] text-espresso mt-2 leading-[1.2]">
        More freedom. Poured at 2% interest.
      </Label>
      <div className="mt-6 z-10">
        <Button variant="outline" className="px-6 font-['InterMedium']" size="lg">
          Follow X for launch
        </Button>
      </div>
    </div>
  );
};

export default Section2;
