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

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
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

  return (
    <div>
      <div
        className="h-[812px] sm:h-[860px] flex flex-col items-center bg-cherry-soda relative overflow-hidden"
        onMouseMove={handleMouseMove}
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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
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
                <Label className="text-[12px] sm:text-[14px] md:text-[14px] lg:text-[18px] text-white  mr-5 font-[InterRegular]">
                  DeFi for all chains - built on
                </Label>
                <Image src="/sonic.png" alt="Sonic Symbol" width={76} height={24} />
              </div>
              <div className="relative">
                <Label className="mix-blend-hard-light text-[60px] sm:text-[90px] md:text-[138px] lg:text-[184px] leading-none text-yellow-soda font-[InterBlack]">
                  LIQUIDITY
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
                <Label className="text-white text-[26px] sm:text-3xl md:text-6xl font-medium font-['InterMedium'] leading-none">
                  when{' '}
                </Label>
                <Label className="text-white text-[26px] sm:text-3xl md:text-6xl font-normal font-['Shrikhand'] leading-none ml-3 mt-[3px] sm:mt-[5px] md:mt-[10px]">
                  you
                </Label>
                <Label className="text-white text-[26px] sm:text-3xl md:text-6xl font-medium font-['InterMedium'] leading-none ml-3">
                  {' '}
                  need it.
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
              <div className="inline-flex justify-center items-start relative">
                <DecoratedButton>pre-register</DecoratedButton>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="min-h-[480px] bg-cherry-bright bg-[url('/circle.png')] bg-no-repeat bg-center bg-bottom py-[80px] w-[90%] lg:max-w-[952px] dialog-content">
          <DialogHeader>
            <div className="flex justify-center">
              <Image src="/symbol.png" alt="SODAX Symbol" width={64} height={64} />
            </div>
            <DialogTitle className="text-center text-white text-[42px] mt-4 font-[InterBlack]">
              SHAKE IT UP!
            </DialogTitle>
            <DialogDescription className="text-center text-white text-base">
              SODAX Rewards Coming Soon.
            </DialogDescription>
          </DialogHeader>
          <div className="grid">
            <div className="flex justify-center">
              <Input
                placeholder="Add your X handle"
                className="border border-white h-[36px] w-full max-w-[280px] text-white rounded-full border-4 border-white text-center placeholder:text-cream"
              />
            </div>
          </div>
          <DialogFooter>
            <div className="flex justify-center items-center w-full">
              <div className="inline-flex justify-center items-start">
                <DecoratedButton variant="yellow-soda">pre-register</DecoratedButton>
              </div>
            </div>
          </DialogFooter>
          <div className="flex items-center justify-center space-x-2">
            <Checkbox id="terms" className="bg-white" />
            <Label htmlFor="terms" className="text-white">
              Accept terms and conditions
            </Label>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HeroSection;
