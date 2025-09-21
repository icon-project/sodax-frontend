'use client';

import type React from 'react';

import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import type { CarouselApi } from '@/components/ui/carousel';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogPortal,
} from '@/components/ui/dialog';

import { useEffect, useRef, useState } from 'react';

import { Link as ScrollLink } from 'react-scroll';

import { Label } from '@/components/ui/label';
import Autoplay from 'embla-carousel-autoplay';
import Sidebar from './sidebar';
import { ArrowLeft } from 'lucide-react';
// import { TermsContent } from '@/components/shared/wallet-modal2/terms-content';
import { LaunchButton } from './launch-button';

const carouselItems = [
  { id: 1, src: '/coin/base.png', alt: 'BASE' },
  { id: 2, src: '/coin/bnb.png', alt: 'BNB Chain' },
  { id: 3, src: '/coin/avax.png', alt: 'AVALANCHE' },
  { id: 4, src: '/coin/pol.png', alt: 'POLYGON' },
  { id: 5, src: '/coin/ste.png', alt: 'Stellar' },
  { id: 6, src: '/coin/arb.png', alt: 'ARB' },
  { id: 7, src: '/coin/s.png', alt: 'SONIC' },
  { id: 8, src: '/coin/sol.png', alt: 'SOLANA' },
  { id: 9, src: '/coin/sui.png', alt: 'SUI' },
  { id: 10, src: '/coin/inj.png', alt: 'Injective' },
  { id: 11, src: '/coin/op.png', alt: 'OPTIMISM' },
];

const HeroSection = ({
  toggle,
  isOpen,
  isRewardDialogOpen,
  onRewardDialogChange,
}: {
  toggle: () => void;
  isOpen: boolean;
  isRewardDialogOpen: boolean;
  onRewardDialogChange: (open: boolean) => void;
}): React.ReactElement => {
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [xHandle, setXHandle] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const constrain = 20;
  const imgRef = useRef<HTMLImageElement>(null);
  const carouselRef = useRef(null);
  const [api, setApi] = useState<CarouselApi>();
  const [isConnected, setIsConnected] = useState(false);
  // const { isRegistering, notification, mounted, handleWalletClick, isConnected, address } = useWallet();

  useEffect(() => {
    if (!api) {
      return;
    }

    api.on('select', () => {});
  }, [api]);

  const handleMouseEnter = () => {
    api?.plugins().autoplay.stop();
  };

  const handleMouseLeave = () => {
    api?.plugins().autoplay.play();
  };

  const handleTermsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsTermsModalOpen(true);
  };

  return (
    <div className="hero-section">
      <div className="h-[812px] sm:h-[860px] flex flex-col items-center bg-cherry-soda relative overflow-hidden">
        {/* <Notification type={notification?.type || null} message={notification?.message || null} /> */}

        <img
          className="mix-blend-screen absolute bottom-0 right-0 sm:-right-5 sm:bottom-30 lg:left-[50%] lg:bottom-0 w-[375px] h-[562px] sm:w-[408px] sm:h-[612px] lg:w-[541px] lg:h-[811px]"
          src="/girl.png"
          alt="background"
          width={541}
          height={811}
        />
        {/* Menu Bar */}
        <div className="w-full flex justify-between items-center p-6 max-w-[1200px] pt-10 z-20">
          <div className="flex items-center">
            <div className="flex lg:hidden mr-2 text-white" onClick={toggle}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-label="Menu">
                <title>Menu</title>
                <path fill="#fff" d="M3 6h18v2H3V6m0 5h18v2H3v-2m0 5h18v2H3v-2Z" />
              </svg>
            </div>
            <div
              className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <img src="/symbol.png" alt="SODAX Symbol" width={32} height={32} className="mr-2" />
              {/* <span className="font-black text-2xl text-white logo-word hidden sm:flex">SODAX</span> */}
              <svg
                className="hidden sm:flex"
                xmlns="http://www.w3.org/2000/svg"
                width="84"
                height="18"
                viewBox="0 0 84 18"
                fill="none"
                aria-label="SODAX"
              >
                <title>SODAX</title>
                <path
                  d="M10.5058 7.32721C10.0229 7.20648 9.53998 7.08576 9.05708 6.96503C7.30656 6.54249 5.76732 6.18032 5.70696 5.15415C5.70696 3.97708 7.18584 3.91672 7.63856 3.91672C8.24219 3.91672 8.81563 4.06762 9.20799 4.33926C9.66071 4.64107 9.90216 5.09379 9.87198 5.60687H14.2785C14.037 1.26076 10.0531 0.626953 7.66874 0.626953C4.71097 0.626953 1.30048 1.98511 1.30048 5.81814C1.30048 8.86646 3.89607 9.59081 6.40112 10.285L6.67276 10.3755C9.44944 11.1602 10.2643 11.4017 10.2643 12.3675C10.2643 13.5747 9.11744 13.9973 8.0611 13.9973C6.70294 13.9973 5.85786 13.5747 5.52587 12.7297C5.40514 12.458 5.34478 12.126 5.34478 11.7639H0.666672C0.817578 17.0154 6.49167 17.2871 7.63856 17.2871C9.3589 17.2871 14.9726 16.8947 14.9726 11.8544C14.9726 8.957 12.709 7.93084 10.5058 7.32721Z"
                  fill="white"
                />
                <path
                  d="M24.9324 0.626953C20.1939 0.626953 16.8739 4.06763 16.8739 8.957C16.8739 13.8464 20.1939 17.2871 24.9324 17.2871C29.6708 17.2871 32.9908 13.8464 32.9908 8.957C32.9908 4.06763 29.6708 0.626953 24.9324 0.626953ZM24.9324 13.5446C23.3026 13.5446 21.5521 12.3373 21.5521 8.957C21.5521 5.57669 23.3026 4.36944 24.9324 4.36944C26.5622 4.36944 28.3127 5.57669 28.3127 8.957C28.3127 12.3373 26.5622 13.5446 24.9324 13.5446Z"
                  fill="white"
                />
                <path
                  d="M50.3752 8.92597C50.3752 7.05473 49.8621 0.988281 43.2222 0.988281H35.1939V16.8938H42.2564C47.4777 16.8938 50.3752 14.0568 50.3752 8.92597ZM39.872 13.0608V4.85149H41.6226C45.3952 4.85149 45.697 7.92999 45.697 8.86561C45.697 10.435 45.2141 13.0608 41.9847 13.0608H39.872Z"
                  fill="white"
                />
                <path
                  d="M61.6629 14.6011L62.3571 16.9251H67.1861L61.3913 1.01953H56.7132L50.858 16.9251H55.5361L56.2605 14.6011H61.6629ZM58.9466 6.12018H59.2182L60.7575 11.4019H57.2866L58.9466 6.12018Z"
                  fill="white"
                />
                <path
                  d="M77.7194 16.9281H83.3332L77.6591 8.50752L82.7597 1.05273H77.5987L75.0937 5.61012L72.5584 1.05273H67.0956L72.317 8.47734L66.5523 16.9281H71.8944L74.8522 11.9482L77.7194 16.9281Z"
                  fill="white"
                />
              </svg>
            </div>
          </div>
          <div className="flex items-center">
            {/* Navigation Menu and Button */}
            <ul className="hidden lg:flex gap-4 z-10">
              <li>
                <ScrollLink to="section1" smooth={true} duration={500}>
                  <span className="text-white font-[InterMedium] text-[14px] transition-all hover:font-bold cursor-pointer">
                    About
                  </span>
                </ScrollLink>
              </li>
            </ul>
            <div className="inline-flex justify-center items-start relative mr-2 ml-5">
              {/* <DecoratedButton
                onClick={() => onRewardDialogChange(true)}
                isConnected={isConnected}
                address={address}
                showAddressInfo={true}
              >
                join waitlist
              </DecoratedButton> */}
              <LaunchButton>launch apps</LaunchButton>
            </div>
          </div>
        </div>

        <Sidebar isOpen={isOpen} toggle={toggle} setOpenRewardDialog={onRewardDialogChange} />

        {/* Center Content */}
        <div className="w-full flex justify-center h-[700px]">
          <div className="text-center">
            <div className="text-content w-[300px] sm:w-[400px] md:w-full mt-[30px] sm:mt-[170px] lg:mt-[140px]">
              <div className="flex items-center">
                <Label className="text-[12px] sm:text-[14px] md:text-[14px] lg:text-[24px] text-white  mr-5 font-[InterRegular] leading-[1.1] font-bold">
                  No banks, no borders, just freedom.
                </Label>
              </div>
              <div className="relative">
                <Label className="mix-blend-hard-light text-[80px] sm:text-[90px] md:text-[138px] lg:text-[184px] leading-none text-yellow-soda font-[InterBlack]">
                  MONEY
                </Label>
                <img
                  className="mix-blend-color-dodge absolute max-w-none w-[357px] h-[357px] sm:w-[701px] sm:h-[701px] top-[-100px] left-[-170px] sm:top-[-310px] sm:left-[-310px]"
                  src="/circle1.png"
                  alt="background"
                  width={701}
                  height={701}
                  ref={imgRef}
                />
              </div>

              <div className="flex">
                <Label className="text-white text-[26px] sm:text-3xl md:text-[56px] font-normal font-['InterRegular'] leading-[1.1]">
                  as it{' '}
                </Label>
                <Label className="text-white text-[26px] sm:text-3xl md:text-[56px] font-medium font-['Shrikhand'] leading-[1.1] ml-3 mt-[3px] sm:mt-[5px] md:mt-[10px]">
                  should
                </Label>
                <Label className="text-white text-[26px] sm:text-3xl md:text-[56px] font-normal font-['InterRegular'] leading-[1.1] ml-3">
                  {' '}
                  be.
                </Label>
              </div>
            </div>
            <div className="flex items-center mt-[350px] sm:mt-6 w-[300px] sm:w-full flex-wrap">
              <Label className="font-medium text-[18px] font-[Shrikhand] text-white mr-3">serving</Label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-cherry-soda to-transparent z-10"></div>
                <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                  <Carousel
                    ref={carouselRef}
                    opts={{
                      align: 'start',
                      loop: true,
                    }}
                    plugins={[
                      Autoplay({
                        delay: 2000,
                        stopOnInteraction: true,
                      }),
                    ]}
                    setApi={setApi}
                  >
                    <CarouselContent className="-ml-1 max-w-[150px] mix-blend-lighten">
                      {carouselItems.map(item => (
                        <CarouselItem key={item.id} className="basis-1/5 pl-1">
                          <img src={item.src} alt={item.alt} width={24} height={24} className="border-2 rounded-full" />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                </div>
                <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-cherry-soda to-transparent z-10"></div>
              </div>
              <div className="inline-flex justify-center items-start relative mt-4 sm:ml-2 sm:mt-0">
                {/* <DecoratedButton onClick={() => onRewardDialogChange(true)} isConnected={isConnected}>
                  join waitlist
                </DecoratedButton> */}
                <LaunchButton>launch apps</LaunchButton>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Dialog */}
      <Dialog
        open={isRewardDialogOpen}
        onOpenChange={open => {
          onRewardDialogChange(open);
          if (!open) {
            setIsTermsModalOpen(false);
          }
        }}
      >
        <div className="relative">
          {!isConnected ? (
            <DialogContent
              className="h-[480px] bg-cherry-bright bg-[url('/circle.png')] bg-no-repeat bg-center bg-bottom py-[80px] w-[90%] lg:max-w-[952px] dialog-content transform translate-y-[-65%] lg:mt-0"
              onPointerDownOutside={e => connectModalOpen && e.preventDefault()}
            >
              <DialogHeader>
                <div className="flex justify-center">
                  <img src="/symbol.png" alt="SODAX Symbol" width={64} height={64} />
                </div>
                <DialogTitle className="text-center text-white text-[42px] mt-6 font-[InterBlack] leading-none">
                  REWARDS!
                </DialogTitle>
                {/* <div className="grid">
                  <div className="flex justify-center">
                    <Input
                      placeholder="Add your X handle"
                      value={xHandle}
                      onChange={e => setXHandle(e.target.value)}
                      className="border border-white h-[36px] w-full max-w-[280px] text-white rounded-full border-4 border-white text-center placeholder:text-cream"
                    />
                  </div>
                </div> */}
                <DialogDescription className="text-center text-white text-base">
                  Coming soon. Pre-register your EVM wallet.
                </DialogDescription>
                <div className="flex justify-center items-center w-full mt-6">
                  <div className="inline-flex justify-center items-start">
                    {/* <ConnectWalletButton
                      onWalletClick={handleWalletClick}
                      onConnectModalChange={setConnectModalOpen}
                      isRegistering={!isFormValid}
                    ></ConnectWalletButton> */}
                  </div>
                </div>
                <div className="flex items-center justify-center space-x-2 mt-6">
                  <Checkbox
                    id="terms"
                    className="bg-white rounded-lg"
                    checked={acceptedTerms}
                    onCheckedChange={checked => setAcceptedTerms(checked as boolean)}
                  />
                  <Label htmlFor="terms" className="text-white">
                    Accept{' '}
                    <button
                      type="button"
                      onClick={handleTermsClick}
                      className="underline cursor-pointer hover:text-yellow-soda transition-colors"
                    >
                      terms and conditions
                    </button>
                  </Label>
                </div>
              </DialogHeader>

              {isTermsModalOpen && (
                <div className="absolute inset-0 z-50 flex items-end" onClick={() => setIsTermsModalOpen(false)}>
                  <div
                    className="bg-cherry-bright bg-white bg-no-repeat bg-center bottom-0 h-[400px] rounded-[32px] px-[32px] pt-[50px] pb-[10px] md:pb-[32px] md:px-[80px] md:pt-[70px] lg:pb-[50px] lg:px-[160px] lg:pt-[100px]"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-start mb-6 gap-2">
                      <button
                        type="button"
                        onClick={() => setIsTermsModalOpen(false)}
                        className="flex items-center gap-2 text-white hover:text-yellow-soda transition-colors"
                      >
                        <ArrowLeft className="text-espresso"></ArrowLeft>
                      </button>
                      <img src="/symbol.png" alt="SODAX Symbol" width={24} height={24} />
                      <h2 className="text-center text-black text-lg font-['InterBold'] leading-snug">
                        Terms and conditions
                      </h2>
                    </div>
                    <div className="relative">
                      <div className="bg-white text-black max-h-[200px] overflow-y-auto">
                        {/* <TermsContent /> */}
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          ) : (
            <DialogContent className="h-[480px] bg-cherry-bright bg-[url('/circle.png')] bg-no-repeat bg-center bg-bottom py-[127px] w-[90%] lg:max-w-[952px] dialog-content mt-5 lg:mt-0">
              <DialogHeader>
                <div className="flex justify-center">
                  <img src="/symbol.png" alt="SODAX Symbol" width={64} height={64} />
                </div>
                <DialogTitle className="text-center text-white text-[42px] mt-6 font-[InterBlack] leading-none">
                  IN THE MIX!
                </DialogTitle>
                <DialogDescription className="text-center text-white text-base">
                  You're on the list. Now join us on Discord.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-center">
                <Button
                  className="rounded-full cursor-pointer mt-6 w-[132px]"
                  variant="subtle"
                  size="lg"
                  onClick={() => window.open('https://discord.gg/xM2Nh4S6vN', '_blank')}
                >
                  Join Discord
                </Button>
              </div>
            </DialogContent>
          )}
        </div>
      </Dialog>
    </div>
  );
};

export default HeroSection;
