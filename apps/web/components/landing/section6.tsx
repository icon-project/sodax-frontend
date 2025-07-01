import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

const Section6 = () => {
  return (
    <div className="flex flex-col lg:flex-row section6">
      <div className="w-full lg:w-1/2 flex flex-col items-center pt-[40px] sm:pt-[60px] bg-cherry-soda  h-[440px] sm:h-[480px] md:h-[480px] mt-2 relative overflow-hidden">
        <Image
          className="mix-blend-screen absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[514px] sm:w-[683px] max-w-[990px]"
          src="/section4.png"
          alt="background"
          width={990}
          height={660}
        />
        <div className="flex items-center">
          <span className="text-[24px] md:text-[32px] leading-[1.1] font-[InterBold] text-yellow-soda">
            Not gas, but fire
          </span>
        </div>
        <Label className="text-sm sm:text-base font-[Inter] text-white leading-[1.4] mt-2 font-normal">
          All platform and partner fees burn $SODA supply.
        </Label>
        <div className="mt-6 z-10">
          <Button
            className="rounded-full"
            variant="subtle"
            size="lg"
            onClick={() => window.open('https://discord.gg/xM2Nh4S6vN', '_blank')}
          >
            Join Discord
          </Button>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex flex-col items-center pt-[40px] sm:pt-[60px] bg-cherry-soda  h-[440px] sm:h-[480px] md:h-[480px] mt-2 lg:ml-2 relative overflow-hidden">
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
            <span className="text-[24px] md:text-[32px] leading-[1.1] font-[InterBold] text-yellow-soda">
              13 chains in seconds
            </span>
          </div>
        </div>
        <Label className="text-sm sm:text-base font-[Inter] text-white leading-[1.4] mt-2 font-normal">
          The best value. Delivered with Intents.
        </Label>
        <div className="mt-6">
          <Button
            className="rounded-full"
            variant="subtle"
            size="lg"
            onClick={() => window.open('https://discord.gg/xM2Nh4S6vN', '_blank')}
          >
            Join Discord
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Section6;
