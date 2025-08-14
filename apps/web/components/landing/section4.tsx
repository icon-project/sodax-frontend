import { DecoratedButton } from '@/components/landing/decorated-button';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import ConnectWalletButton from '../ui/connect-wallet-button';
// import { useWallet } from '../../hooks/useWallet';
import { Notification } from '../Notification';
import { LaunchButton } from './launch-button';

const Section4 = ({ onOpenRewardDialog }: { onOpenRewardDialog: () => void }) => {
  // const { isRegistering, notification, mounted, handleWalletClick, isConnected } = useWallet();

  return (
    <div className="flex flex-col lg:flex-row section4">
      <div className="w-full lg:w-1/2 flex flex-col items-center pt-[40px] sm:pt-[60px] bg-yellow-dark h-[440px] sm:h-[480px] md:h-[480px] mt-4 lg:mr-4 relative z-1">
        <Image
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[343px] sm:w-[368px] z-2"
          src="/section3-2.png"
          alt="background"
          width={398}
          height={185}
        />
        <div className="flex items-center">
          <span className="text-[24px] md:text-[32px] leading-[1.1] font-[InterBold] text-cherry-dark">Level up!</span>
        </div>
        <Label className="text-sm sm:text-base font-[InterRegular] text-black leading-[1.4] mt-2 font-normal">
          Points with every order.
        </Label>
        <div className="mt-6">
          {/* <DecoratedButton variant="white" isConnected={isConnected} onClick={onOpenRewardDialog}>
            join waitlist
          </DecoratedButton> */}
          <LaunchButton variant="white">launch apps</LaunchButton>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex flex-col items-center pt-[40px] sm:pt-[60px] h-[440px] sm:h-[480px] md:h-[480px] mt-4 bg-[radial-gradient(circle_at_center,_#5C3623,_#1C1C24)] relative z-1">
        <Image
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[398px] z-2"
          src="/new-section3-1.png"
          alt="background"
          width={398}
          height={185}
        />
        <div className="flex items-center">
          <Image src="/coin/s.png" alt="SODAX Symbol" width={32} height={32} />
          <span className="text-[24px] md:text-[32px] leading-[1.1] font-[InterBold] ml-5 text-white">
            Sonic Summit
          </span>
        </div>
        <Label className="text-sm sm:text-base font-[InterRegular] text-white font-normal leading-[1.4] mt-2">
          Crack open a cold one with the team.
        </Label>
        <div className="mt-6">
          <Button
            className="rounded-full cursor-pointer"
            variant="subtle"
            size="lg"
            onClick={() => window.open('https://www.soniclabs.com/summit', '_blank')}
          >
            Sign up
          </Button>
        </div>
        <Label className="text-[18px] font-bold font-[InterRegular] text-cherry-bright mt-[38px] sm:mt-[51px] leading-[1.2]">
          29-30, September
        </Label>
        <Label className="text-[42px] font-black font-[InterRegular] text-orange-sonic leading-[1.1] mt-[10px]">
          SINGAPORE
        </Label>
      </div>
    </div>
  );
};

export default Section4;
