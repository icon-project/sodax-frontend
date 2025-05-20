import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

const Section5 = () => {
  return (
    <div className="h-[440px] sm:h-[480px] md:h-[560px] flex flex-col items-center bg-cherry-soda mt-2 pt-[40px] sm:pt-[60px] relative overflow-hidden section5">
      <Image
        className="mix-blend-screen absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[626px] md:w-[797px] max-w-[990px]"
        src="/section4.png"
        alt="background"
        width={797}
        height={660}
      />
      <div className="flex items-center">
        <div className="inline-flex justify-center items-center gap-4 ml-5">
          <div className="text-center justify-center">
            <span className="text-yellow-soda text-[24px] sm:text-5xl font-['InterBlack'] leading-10">
              Not gas, but{' '}
            </span>
            <span className="text-yellow-soda text-[24px] sm:text-5xl font-normal font-['Shrikhand'] leading-10">
              fire
            </span>
          </div>
        </div>
      </div>
      <Label className="text-[12px] md:text-[18px] font-[InterRegular] text-white mt-5">
        All platform and partner fees burn $SODA supply.
      </Label>
      <div className="mt-4 z-10">
        <Button className="mr-2 rounded-full w-[133px]" variant="subtle" size="lg">
          Learn more
        </Button>
        <Button variant="ghost" className="px-6 font-['InterMedium']" size="lg">
          Secondary CTA
        </Button>
      </div>
    </div>
  );
};

export default Section5;
