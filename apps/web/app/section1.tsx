import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

const Section1 = () => {
  return (
    <div className="h-[440px] md:h-[560px] flex flex-col items-center bg-Almost-white mt-2 pt-[40px] sm:pt-[60px] relative overflow-hidden section1">
      <Image
        className="mix-blend-multiply absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[777px] md:w-[990px] max-w-[990px]"
        src="/sodax.png"
        alt="background"
        width={990}
        height={660}
      />
      <div className="flex items-center">
        <Image
          src="/symbol.png"
          alt="SODAX Symbol"
          width={32}
          height={32}
        />
        <div className="text-center justify-center ml-5">
          <span className="text-Black text-[24px] md:text-5xl font-normal font-['Shrikhand'] leading-10">save</span>
          <span className="text-Black text-[24px] md:text-5xl font-black font-['InterBlack'] leading-10"> today, sip later</span>
        </div>
      </div>
      <Label className="text-xs sm:text-[18px] font-[InterRegular] text-Espresso mt-3">Supply for a fully carbonated future.</Label>
      <div className="mt-4">
        <Button className="h-10 px-6 rounded-3xl outline outline-4 outline-solid outline-offset-[-4px] outline-red inline-flex justify-end items-center gap-1.5 bg-transparent">
          <div className="justify-start text-Espresso text-sm font-medium font-['InterMedium'] leading-tight z-10">Follow X for launch</div>
        </Button>
      </div>
    </div>
  );
};

export default Section1;
