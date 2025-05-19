import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

const Section6 = () => {
  return (
    <div className="flex flex-col lg:flex-row section6">
      <div className="w-full lg:w-1/2 flex flex-col items-center pt-[40px] sm:pt-[60px] bg-Cherry-soda h-[440px] sm:h-[480px] mt-2 relative overflow-hidden">
        <Image
          className="mix-blend-screen absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[514px] sm:w-[561px] max-w-[990px]"
          src="/section5-1.png"
          alt="background"
          width={990}
          height={660}
        />
        <div className="flex items-center">
          <Image src="/symbol.png" alt="SODAX Symbol" width={32} height={32} />
          <span className="text-[24px] md:text-[32px] font-[InterBlack] ml-5 text-Yellow-soda">Reliable liquidity</span>
        </div>
        <Label className="text-xs font-[InterRegular] text-white">Owned by us. There for you.</Label>
        <div className="mt-4 z-10">
          <Button className="bg-[transparent] border-4 rounded-full w-[152px] h-[40px] text-white z-10">
            Learn more
          </Button>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex flex-col items-center pt-[40px] sm:pt-[60px] bg-Cherry-soda h-[440px] sm:h-[480px] mt-2 lg:ml-2 relative overflow-hidden">
        <Image
          className="mix-blend-screen absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[577px] sm:w-[629px] max-w-[990px]"
          src="/section5-2.png"
          alt="background"
          width={990}
          height={660}
        />
        <div className="flex items-center">
          <Image src="/symbol.png" alt="SODAX Symbol" width={32} height={32} />
          <div className='flex flex-col'>
          <div className="text-center justify-center text-Yellow-soda text-2xl font-bold font-['InterBlack'] leading-relaxed">13 chains in seconds</div>

          <span className="text-[24px] md:text-[32px] font-[InterBlack] ml-5 text-Yellow-soda">
            13 chains in seconds
          </span>
          </div>
        </div>
        <Label className="text-xs font-[InterRegular] text-white">The best value. Delivered with Intents.</Label>
        <div className="mt-4">
          <Button className="bg-[transparent] border-4 rounded-full w-[152px] h-[40px] text-white">
            Learn more
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Section6;
