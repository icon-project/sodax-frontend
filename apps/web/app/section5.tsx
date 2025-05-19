import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

const Section5 = () => {
  return (
    <div className="h-[440px] md:h-[560px] flex flex-col items-center bg-Cherry-soda mt-2 pt-[40px] sm:pt-[60px] relative overflow-hidden section5">
      <Image
        className="mix-blend-screen absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[626px] md:w-[797px] max-w-[990px]"
        src="/section4.png"
        alt="background"
        width={990}
        height={660}
      />
      <div className="flex items-center">
        <Image
          className='z-1'
          src="/symbol.png"
          alt="SODAX Symbol"
          width={32}
          height={32}
        />
        <div className="inline-flex justify-center items-center gap-4">
          <div className="text-center justify-center">
            <span className="text-Yellow-soda text-[24px] sm:text-5xl font-['InterBlack'] leading-10">Not gas, but </span>
            <span className="text-Yellow-soda text-[24px] sm:text-5xl font-normal font-['Shrikhand'] leading-10">fire</span>
          </div>
        </div>
      </div>
      <Label className="text-[12px] md:text-[18px] font-[InterRegular] text-white mt-5">
        All platform and partner fees burn $SODA supply.
      </Label>
      <div className="mt-4 z-10">
        <Button className="mr-2 bg-white rounded-full w-[133px] h-[40px] text-black">Learn more</Button>
        <Button className="bg-[transparent] border-4 rounded-full w-[152px] h-[40px] text-white">
          Secondary CTA
        </Button>
      </div>
    </div>
  );
};

export default Section5;
