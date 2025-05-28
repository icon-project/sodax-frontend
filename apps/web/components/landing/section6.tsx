import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

const Section6 = () => {
  return (
    <div className="flex flex-col lg:flex-row section6 gap-4">
      <div className="w-full lg:w-1/2 flex flex-col items-center pt-[40px] sm:pt-[60px] bg-cherry-soda  h-[440px] sm:h-[480px] relative overflow-hidden">
        <Image
          className="mix-blend-screen absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[514px] sm:w-[561px] max-w-[990px]"
          src="/section5-1.png"
          alt="background"
          width={990}
          height={660}
        />
        <div className="flex items-center">
          <Image src="/symbol_dark.png" alt="SODAX Symbol" width={32} height={32} />
          <span className="text-[24px] md:text-[32px] font-[InterRegular] font-[600] ml-5 text-yellow-soda leading-[110%]">
            Reliable liquidity
          </span>
        </div>
        <Label className="mt-2 text-[14px] font-[500] font-[InterRegular] text-white leading-[140%]">
          Owned by us. There for you.
        </Label>
        <div className="mt-6 z-10">
          <Button variant="ghost" className="px-6 font-['InterMedium']" size="lg">
            Learn more
          </Button>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex flex-col items-center pt-[40px] sm:pt-[60px] bg-cherry-soda  h-[440px] sm:h-[480px] relative overflow-hidden">
        <Image
          className="mix-blend-screen absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[577px] sm:w-[629px] max-w-[990px]"
          src="/section5-2.png"
          alt="background"
          width={990}
          height={660}
        />
        <div className="flex items-center">
          <Image src="/symbol_dark.png" alt="SODAX Symbol" width={32} height={32} />
          <div className="flex flex-col">
            <span className="text-[24px] md:text-[32px] font-[InterRegular] font-[600] ml-5 text-yellow-soda leading-[110%]">
              13 chains in seconds
            </span>
          </div>
        </div>
        <Label className="mt-2 text-[14px] font-[500] font-[InterRegular] text-white leading-[140%]">
          The best value. Delivered with Intents.
        </Label>
        <div className="mt-6">
          <Button variant="ghost" className="px-6 font-['InterMedium']" size="lg">
            Learn more
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Section6;
