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
import * as DialogPrimitive from '@radix-ui/react-dialog';

import { useEffect, useRef, useState } from 'react';

import { Link as ScrollLink } from 'react-scroll';

import Image from 'next/image';
import Link from 'next/link';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Autoplay from 'embla-carousel-autoplay';
import Sidebar from './sidebar';
import { ArrowLeft } from 'lucide-react';
import { DecoratedButton } from '@/components/landing/decorated-button';
import { useWallet } from '../../hooks/useWallet';
import { Notification } from '../Notification';
import ConnectWalletButton from '@/components/ui/connect-wallet-button';
import { TermsContent } from './terms-content';

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
  isDepositDialogOpen,
  onRewardDialogChange,
  onDepositDialogChange,
}: {
  toggle: () => void;
  isOpen: boolean;
  isRewardDialogOpen: boolean;
  isDepositDialogOpen: boolean;
  onRewardDialogChange: (open: boolean) => void;
  onDepositDialogChange: (open: boolean) => void;
}): React.ReactElement => {
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [xHandle, setXHandle] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const constrain = 20;
  const imgRef = useRef<HTMLImageElement>(null);
  const carouselRef = useRef(null);
  const [api, setApi] = useState<CarouselApi>();
  const { isRegistering, notification, mounted, handleWalletClick, isConnected, address } = useWallet();
  const [hasBeenConnected, setHasBeenConnected] = useState(false);
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

  const transforms = (x: number, y: number, el: HTMLElement) => {
    const box = el.getBoundingClientRect();
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    // Calculate the rotation values
    let calcX = -(y - centerY) / constrain;
    let calcY = (x - centerX) / constrain;

    // Define the maximum allowed rotation angles
    const maxRotationAngle = 20; // You can adjust this value as needed

    // Constrain the rotation values
    calcX = Math.max(-maxRotationAngle, Math.min(maxRotationAngle, calcX));
    calcY = Math.max(-maxRotationAngle, Math.min(maxRotationAngle, calcY));

    return `perspective(500px) rotateX(${calcX}deg) rotateY(${calcY}deg)`;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (imgRef.current) {
      const position = [e.clientX, e.clientY, imgRef.current];
      const transformValue = transforms(...(position as [number, number, HTMLElement]));
      imgRef.current.style.transform = transformValue;
    }
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleTermsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsTermsModalOpen(true);
  };

  const isFormValid = acceptedTerms;

  return (
    <div className="hero-section">
      <div
        className="h-[812px] sm:h-[860px] flex flex-col items-center bg-cherry-soda relative overflow-hidden"
        // onMouseMove={handleMouseMove}
      >
        <Notification type={notification?.type || null} message={notification?.message || null} />

        <Image
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
              <Image src="/symbol.png" alt="SODAX Symbol" width={32} height={32} />
              <span className="ml-2 font-black text-2xl text-white logo-word hidden sm:flex">SODAX</span>
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
              {/* <li>
                <Link href="/docs" passHref>
                  <span className="text-white font-[InterMedium] text-[14px] transition-all hover:font-bold cursor-pointer">
                    Partners
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/docs" passHref>
                  <span className="text-white font-[InterMedium] text-[14px] transition-all hover:font-bold cursor-pointer">
                    Community
                  </span>
                </Link>
              </li> */}
            </ul>
            <div className="inline-flex justify-center items-start relative mr-2 ml-5">
              <DecoratedButton
                onClick={() => onDepositDialogChange(true)}
                isConnected={isConnected}
                address={address}
                showAddressInfo={true}
              >
                join waitlist
              </DecoratedButton>
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
                <Image
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
                          <Image
                            src={item.src}
                            alt={item.alt}
                            width={24}
                            height={24}
                            className="border-2 rounded-full"
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                </div>
                <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-cherry-soda to-transparent z-10"></div>
              </div>
              <div className="inline-flex justify-center items-start relative mt-4 sm:ml-2 sm:mt-0">
                <DecoratedButton onClick={() => onDepositDialogChange(true)} isConnected={isConnected}>
                  join waitlist
                </DecoratedButton>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Dialog
        open={isDepositDialogOpen}
        onOpenChange={open => {
          onDepositDialogChange(open);
        }}
      >
        <DialogPortal>
          <DialogPrimitive.Content className="w-full max-w-[100vw] md:w-[full] md:max-w-[100vw] lg:w-[1024px] lg:max-w-[1024px] bg-transparent p-0 shadow-none border-0 data-[state=open]:animate-none fixed top-[50%] left-[50%] z-50 translate-x-[-50%] translate-y-[-50%]">
            <div className="flex justify-center items-start min-h-[600px] md:min-h-[800px]">
              <div className="hidden md:flex md:w-[264px] lg:w-[304px] flex flex-col justify-center items-start py-4">
                <div className="md:w-[264px] lg:w-[304px] p-[120px_56px] flex flex-col items-start gap-[8px] rounded-lg bg-[linear-gradient(180deg,_#DCBAB5_0%,_#EAD6D3_14.42%,_#F4ECEA_43.27%,_#F5F1EE_100%)] md:h-[768px]"></div>
              </div>

              <div className="w-full md:w-[calc(100%-200px)] lg:w-[784px] min-h-[600px] md:min-h-[800px] p-[120px_80px] flex items-start gap-[8px] rounded-lg border-[8px] border-vibrant-white bg-[radial-gradient(239.64%_141.42%_at_0%_0%,_#E3D8D8_0%,_#F5F2F2_22.12%,_#F5F2F2_57.69%,_#F5EDED_100%)] to-transparent relative md:-ml-16">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="80"
                  viewBox="0 0 16 80"
                  fill="none"
                  aria-label="Deposit Dialog"
                  className="absolute top-[157px] -left-[23px] hidden md:block"
                >
                  <title>Deposit Dialog</title>
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M4.76995e-07 40C3.92926e-07 38.125 0.941131 37.1741 1.88235 36.6667C11.1437 31.6736 16 18.033 16 -1.90798e-07L16 80C16 61.967 11.1437 48.3264 1.88235 43.3333C0.941131 42.8259 5.61065e-07 41.875 4.76995e-07 40Z"
                    fill="#F9F7F5"
                  />
                </svg>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="80"
                  height="16"
                  viewBox="0 0 80 16"
                  fill="none"
                  className="absolute bottom-[-9px] left-[100px] md:hidden transform flex-shrink-0"
                  aria-label="Deposit Dialog"
                >
                  <title>Deposit Dialog</title>
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M40 -1.27146e-06C41.875 -1.27357e-06 42.8259 0.941129 43.3333 1.88235C48.3264 11.1437 61.967 16 80 16L-5.08584e-07 16C18.033 16 31.6736 11.1437 36.6667 1.88235C37.1741 0.941129 38.125 -1.26935e-06 40 -1.27146e-06Z"
                    fill="oklch(0.57 0.1 28.5)"
                  />
                </svg>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
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
              onPointerDownOutside={e => e.preventDefault()}
            >
              <DialogHeader>
                <div className="flex justify-center">
                  <Image src="/symbol.png" alt="SODAX Symbol" width={64} height={64} />
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
                    <ConnectWalletButton
                      onWalletClick={handleWalletClick}
                      isRegistering={!isFormValid}
                      onCloseRewardDialog={() => onRewardDialogChange(false)}
                      onOpenRewardDialog={() => onRewardDialogChange(true)}
                    ></ConnectWalletButton>
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

              {/* Terms Modal Overlay */}
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
                      <Image src="/symbol.png" alt="SODAX Symbol" width={24} height={24} />
                      <h2 className="text-center text-black text-lg font-['InterBold'] leading-snug">
                        Terms and conditions
                      </h2>
                    </div>
                    <div className="relative">
                      <div className="bg-white text-black rounded-lg max-h-[200px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-cream [&::-webkit-scrollbar-thumb]:bg-cream [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:h-[108px] relative">
                        <TermsContent />
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
                  <Image src="/symbol.png" alt="SODAX Symbol" width={64} height={64} />
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
