import { DecoratedButton } from '@/components/landing/decorated-button';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

const Section4 = () => {
  return (
    <div className="flex flex-col-reverse lg:flex-row section4 gap-4 ">
      <div className="w-full lg:w-1/2 flex flex-col gap-2 items-center pt-[40px] sm:pt-[60px] h-[440px] sm:h-[480px] bg-[#9A6DDD] relative z-1">
        <Image
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[398px] z-2"
          src="/stellar_summar_rewards.png"
          alt="background"
          width={398}
          height={185}
        />
        <div className="flex items-center gap-4">
          <Image src="/hana.svg" alt="SODAX Symbol" width={32} height={32} />
          <span className="text-[24px] md:text-[32px] font-[InterRegular] font-[600] leading-[110%] text-white">
            Stellar Summer Rewards
          </span>
        </div>
        <Label className="text-[14px] font-[500] font-[InterRegular] text-white">$30,000 up for grabs.</Label>
        <div className="mt-4">
          <Button className="mr-2 rounded-full w-[133px]" variant="subtle" size="lg">
            Start earning
          </Button>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex flex-col gap-2 items-center pt-[40px] sm:pt-[60px] bg-yellow-dark  h-[440px] sm:h-[480px] relative z-1">
        <Image
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[398px] z-2"
          src="/section3-2.png"
          alt="background"
          width={398}
          height={185}
        />
        <div className="flex items-center">
          <span className="text-[24px] md:text-[32px] font-[InterRegular] font-[600] leading-[110%] text-cherry-dark">
            Level up!
          </span>
        </div>
        <Label className="text-[14px] font-[500] font-[InterRegular] text-black">Points with every order.</Label>
        <div className="mt-4">
          <DecoratedButton variant="white">join waitlist</DecoratedButton>
        </div>
      </div>
    </div>
  );
};

export default Section4;
