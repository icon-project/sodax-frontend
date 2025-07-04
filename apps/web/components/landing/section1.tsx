import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

const Section1 = () => {
  return (
    <div
      className="h-[440px] sm:h-[480px] md:h-[560px] flex flex-col items-center bg-almost-white mt-4 pt-[40px] sm:pt-[60px] relative overflow-hidden section1"
      id="section1"
    >
      <Image
        className="mix-blend-multiply absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[777px] md:w-[990px] max-w-[990px]"
        src="/sodax.png"
        alt="background"
        width={990}
        height={660}
      />
      <div className="flex items-center">
        <Image src="/symbol_dark.png" alt="SODAX Symbol" width={32} height={32} />
        <div className="text-center justify-center ml-5">
          <span className="text-Black text-[24px] md:text-5xl font-normal font-['Shrikhand'] leading-10">save</span>
          <span className="text-Black text-[24px] md:text-5xl font-black font-['InterBlack'] leading-10">
            {' '}
            today, sip later
          </span>
        </div>
      </div>
      <Label className="text-xs sm:text-[18px] font-[InterRegular] text-espresso mt-3">
        Supply for a fully carbonated future.
      </Label>
      <div className="mt-4">
        <Button variant="outline" className="px-6 font-['InterMedium'] cursor-pointer" size="lg">
          Follow X for launch
        </Button>
      </div>
    </div>
  );
};

export default Section1;
