import Image from 'next/image';
import { SodaxIcon } from '../icons/sodax-icon';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { MainCtaButton } from '../landing/main-cta-button';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store-provider';

interface NavbarProps {
  onSwapClick?: () => void;
}

export function Navbar({ onSwapClick }: NavbarProps) {
  const router = useRouter();
  const { setShouldTriggerAnimation } = useAppStore(state => state);

  return (
    <div className="w-full flex justify-between items-center pt-10 z-20 md:px-16 px-8 lg:px-8 lg:max-w-[1264px] mx-auto">
      <div className="flex items-center">
        <SidebarTrigger className="outline-none size-8 p-0 lg:hidden" />
        <div
          className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <Image src="/symbol.png" alt="SODAX Symbol" width={32} height={32} />
          <div className="hidden md:block md:ml-[11px]">
            <SodaxIcon width={84} height={18} fill="white" />
          </div>
          <div className="mix-blend-screen justify-center text-[#edc1bc] text-[9px] font-bold font-['InterRegular'] leading-[1.4] ml-2">
            BETA
          </div>
        </div>
        <div className="justify-center text-cream hidden lg:flex ml-8 gap-1">
          <span className="text-xs font-bold font-[InterRegular] leading-none">Money, as it</span>
          <span className="text-xs font-normal font-[Shrikhand] leading-none mt-[1px]">should</span>
          <span className="text-xs font-bold font-[InterRegular] leading-none">be</span>
        </div>
      </div>
      <div className="flex items-center gap-8">
        {/* Navigation Menu and Button */}
        <ul className="hidden lg:flex gap-4 z-10">
          <li>
            <span
              className="text-white font-[InterRegular] text-[14px] transition-all hover:font-bold cursor-pointer"
              onClick={onSwapClick}
            >
              About
            </span>
          </li>
        </ul>
        <div className="inline-flex justify-center items-start relative">
          <MainCtaButton
            onClick={() => {
              router.push('/swap');
              setShouldTriggerAnimation(true);
            }}
          >
            launch apps
          </MainCtaButton>
        </div>
      </div>
    </div>
  );
}
