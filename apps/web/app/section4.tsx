import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

const Section4 = () => {
  return (
    <div className="flex flex-col lg:flex-row section4">
      <div className="w-full lg:w-1/2 flex flex-col items-center pt-[40px] sm:pt-[60px] h-[440px] sm:h-[480px] mt-2 bg-[radial-gradient(circle_at_center,_#5C3623,_#1C1C24)] relative z-1">
        <Image
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[398px] z-2"
          src="/section3-1.png"
          alt="background"
          width={398}
          height={185}
        />
        <div className="flex items-center">
          <Image src="/symbol4.png" alt="SODAX Symbol" width={32} height={32} />
          <span className="text-[24px] md:text-[32px] font-[InterBlack] ml-5 text-orange-sonic">Sonic Summit</span>
        </div>
        <Label className="text-xs font-[InterRegular] text-white">
          Update copy to reflect the event took place.
        </Label>
        <div className="mt-4">
          <Button className="mr-2 bg-white rounded-full w-[133px] h-[40px] text-black">Main CTA</Button>
          <Button className="bg-[transparent] border-4 rounded-full w-[152px] h-[40px] text-white">
            Secondary CTA
          </Button>
        </div>
        <Label className="text-[17px] font-bold font-[InterRegular] text-cherry-bright mt-16">6-8 Vienna</Label>
        <Label className="text-[46px] font-bold font-[InterRegular] text-orange-sonic leading-none">MAY</Label>
      </div>
      <div className="w-full lg:w-1/2 flex flex-col items-center pt-[40px] sm:pt-[60px] bg-yellow-dark h-[440px] sm:h-[480px] mt-2 lg:ml-2 relative z-1">
        <Image
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[398px] z-2"
          src="/section3-2.png"
          alt="background"
          width={398}
          height={185}
        />
        <div className="flex items-center">
          <span className="text-[24px] md:text-[32px] font-[InterBlack] text-cherry-dark">Level up!</span>
        </div>
        <Label className="text-xs font-[InterRegular] text-black">Points with every order.</Label>
        <div className="mt-4">
          <Button className="w-[183px] h-[40px] bg-white text-cherry-dark font-[Shrikhand] rounded-full ml-3 text-[16px]">
            join waitlist
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Section4;
