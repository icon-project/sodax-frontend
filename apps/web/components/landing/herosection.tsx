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
} from '@/components/ui/dialog';

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

const carouselItems = [
  { id: 1, src: '/coin/sui.png', alt: 'SUI' },
  { id: 2, src: '/coin/btc.png', alt: 'BTC' },
  { id: 3, src: '/coin/avax.png', alt: 'AVAX' },
  { id: 4, src: '/coin/s.png', alt: 's' },
  { id: 5, src: '/coin/inj.png', alt: 'INJ' },
  { id: 6, src: '/coin/soda.png', alt: 'SODA' },
];

const HeroSection = ({ toggle, isOpen }: { toggle: () => void; isOpen: boolean }): React.ReactElement => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [xHandle, setXHandle] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const constrain = 20;
  const imgRef = useRef<HTMLImageElement>(null);
  const carouselRef = useRef(null);
  const [api, setApi] = useState<CarouselApi>();

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

  const isFormValid = xHandle.trim() !== '' && acceptedTerms;

  return (
    <div className="hero-section">
      <div
        className="h-[812px] sm:h-[860px] flex flex-col items-center bg-cherry-soda relative overflow-hidden"
        // onMouseMove={handleMouseMove}
      >
        <Image
          className="mix-blend-screen absolute bottom-0 right-0 sm:-right-5 sm:bottom-30 lg:left-[50%] lg:bottom-0 w-[375px] h-[562px] sm:w-[408px] sm:h-[612px] lg:w-[541px] lg:h-[811px]"
          src="/girl.png"
          alt="background"
          width={541}
          height={811}
        />
        {/* Menu Bar */}
        <div className="w-full flex justify-between items-center p-6 max-w-[1200px] pt-10">
          <div className="flex items-center">
            <Image src="/symbol.png" alt="SODAX Symbol" width={32} height={32} />
            <span className="ml-2 font-black text-2xl text-white logo-word hidden sm:flex">SODAX</span>
            <span className="ml-8 mt-[2px] font-[InterBold] text-cream text-[12px] hidden lg:flex">
              The Unified Liquidity Layer
            </span>
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
              <DecoratedButton onClick={() => setIsDialogOpen(true)}>join waitlist</DecoratedButton>
            </div>
            <div className="flex lg:hidden ml-3 text-white" onClick={toggle}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-label="Menu">
                <title>Menu</title>
                <path fill="#fff" d="M3 6h18v2H3V6m0 5h18v2H3v-2m0 5h18v2H3v-2Z" />
              </svg>
            </div>
          </div>
        </div>

        <Sidebar isOpen={isOpen} toggle={toggle} />

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
                <Label className="mix-blend-hard-light text-[60px] sm:text-[90px] md:text-[138px] lg:text-[184px] leading-none text-yellow-soda font-[InterBlack]">
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
                <DecoratedButton>pre-register</DecoratedButton>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={open => {
          setIsDialogOpen(open);
          if (!open) {
            setIsTermsModalOpen(false);
          }
        }}
      >
        <div className="relative">
          <DialogContent className="h-[480px] bg-cherry-bright bg-[url('/circle.png')] bg-no-repeat bg-center bg-bottom py-[80px] w-[90%] lg:max-w-[952px] dialog-content">
            <DialogHeader>
              <div className="flex justify-center">
                <Image src="/symbol.png" alt="SODAX Symbol" width={64} height={64} />
              </div>
              <DialogTitle className="text-center text-white text-[42px] mt-6 font-[InterBlack] leading-none">
                REWARDS!
              </DialogTitle>
              <div className="grid">
                <div className="flex justify-center">
                  <Input
                    placeholder="Add your X handle"
                    value={xHandle}
                    onChange={e => setXHandle(e.target.value)}
                    className="border border-white h-[36px] w-full max-w-[280px] text-white rounded-full border-4 border-white text-center placeholder:text-cream"
                  />
                </div>
              </div>
              <DialogDescription className="text-center text-white text-base">
                Coming soon. Pre-register your EVM wallet.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <div className="flex justify-center items-center w-full mt-2">
                <div className="inline-flex justify-center items-start">
                  <DecoratedButton variant={isFormValid ? 'yellow-soda' : 'cherry-brighter'} disabled={!isFormValid}>
                    pre-register
                  </DecoratedButton>
                </div>
              </div>
            </DialogFooter>
            <div className="flex items-center justify-center space-x-2 mt-2">
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
                    <div className="bg-white text-black rounded-lg max-h-[200px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-cream [&::-webkit-scrollbar-thumb]:bg-cream [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:h-[108px]">
                      <div className="space-y-4 text-xs leading-relaxed text-clay mr-6">
                        <p>
                          This is randomly generated text. By accessing or using this Web3 DeFi platform ("the
                          Service"), you acknowledge and agree that all interactions are decentralized and performed at
                          your own risk. The Service operates through smart contracts on public blockchains, with no
                          central authority or user fund custody. Users are fully responsible for managing their own
                          wallets, private keys, and transaction decisions. Any irreversible loss of access or funds due
                          to user error or technical failure is solely the user's responsibility. This Service is
                          provided "as is" without warranties, express or implied. We disclaim liability for any issues
                          arising from code exploits, network outages, or integration failures. You accept that
                          participation involves significant financial risk, including potential total loss of digital
                          assets. No guarantees are made regarding functionality, uptime, or financial returns.
                          Continued use constitutes acceptance of these conditions and acknowledgment that you
                          understand and assume all associated risks.
                        </p>
                        <p>
                          Additional terms and conditions may apply. Please review all documentation carefully before
                          proceeding with any transactions. The platform reserves the right to modify these terms at any
                          time without prior notice. Users are responsible for staying informed about any changes to the
                          terms of service.
                        </p>
                      </div>
                    </div>
                    {/* Fade out effect at the bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </div>
      </Dialog>
    </div>
  );
};

export default HeroSection;
