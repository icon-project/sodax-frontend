'use client'

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import './landing.css';
import Image from 'next/image'; // Import the Image component
import Link from 'next/link';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"

const carouselItems = [
  { id: 1, src: "/coin/sui.png", alt: "SUI" },
  { id: 2, src: "/coin/btc.png", alt: "BTC" },
  { id: 3, src: "/coin/s.png", alt: "s" },
  { id: 4, src: "/coin/inj.png", alt: "INJ" },
  { id: 5, src: "/coin/avax.png", alt: "AVAX" },
  { id: 6, src: "/coin/soda.png", alt: "SODA" },
  { id: 7, src: "/coin/arb.png", alt: "ARB" },
  { id: 8, src: "/coin/eth.png", alt: "ETH" },
  { id: 9, src: "/coin/msui.png", alt: "MSUI" },
  { id: 10, src: "/coin/pol.png", alt: "POL" },
  { id: 11, src: "/coin/usdc.png", alt: "USDC" },
  { id: 12, src: "/coin/usdt.png", alt: "USDT" },
  { id: 13, src: "/coin/wsteth.png", alt: "wstETH" },
  { id: 14, src: "/coin/xlm.png", alt: "XLM" },
  { id: 15, src: "/coin/stx.png", alt: "STX" },
  { id: 16, src: "/coin/base.png", alt: "BASE" },
];

const LandingPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setIsDialogOpen(true);
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <div className="h-[860px] flex flex-col items-center bg-[#A55C55] hero-section">
        {/* Menu Bar */}
        <div className="w-full flex justify-between items-center p-6 max-w-[1200px]">
          <div className="flex items-center">
            <Image
                src="/symbol.png" // Path to the image in the public directory
                alt="SODAX Symbol"
                width={32} // Set the width of the image
                height={32} // Set the height of the image
              />
            <span className="ml-2 font-black text-2xl text-white logo-word">SODAX</span>
            <span className="ml-4 font-[InterBlack] text-[#EADED4] text-[12px] logo-desc">The Unified Liquidity Layer</span>
          </div>
          <div className="flex items-center">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link href="/docs" passHref legacyBehavior>
                    <NavigationMenuLink className="text-white font-[InterMedium] text-[14px]">
                      About
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/docs" passHref legacyBehavior>
                    <NavigationMenuLink className="text-white font-[InterMedium] text-[14px]">
                    Partners
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/docs" passHref legacyBehavior>
                    <NavigationMenuLink className="text-white font-[InterMedium] text-[14px]">
                    Community
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            <Button className="w-[183px] h-[40px] bg-[#ECC100] text-[#9C4846] font-[Shrikhand] rounded-full ml-3 text-[16px] join-button">join waitlist</Button>
          </div>
        </div>
        {/* Center Content */}
        <div className="w-full flex justify-center h-[700px]">
          <div className="text-center">
            <div className="text-content mt-[130px]">
              <div className="flex items-center">
                <Label className='text-[12px] sm:text-[14px] md:text-[14px] lg:text-[18px] text-white  mr-5 font-[InterBold]'>DeFi for all chains - built on</Label>
                  <Image
                      src="/sonic.png" // Path to the image in the public directory
                      alt="Sonic Symbol"
                      width={76} // Set the width of the image
                      height={24} // Set the height of the image
                    />
              </div>
              <Label className='text-[60px] sm:text-[138px] md:text-[138px] lg:text-[184px] leading-none text-[#FFD92F] font-[InterBlack]'>LIQUIDITY</Label>
              <Label className='text-[26px] sm:text-[64px] md:text-[64px] lg:text-[56px] text-white mt-2 font-[InterBlack]'>when you need it.</Label>
            </div>
            <div className="flex items-center mt-6 serving">
              <Label className='font-medium text-[18px] font-[Shrikhand] text-white mr-3'>serving</Label>
              <div className="carousel-mask">
                <Carousel 
                opts={{
                  align: "start",
                  loop: true,
                }}

                plugins={[
                  Autoplay({
                    delay: 2000,
                  }),
                ]}>
                  <CarouselContent className='-ml-1 max-w-[150px]'>
                    {carouselItems.map((item) => (
                      <CarouselItem key={item.id} className="basis-1/5 pl-1">
                        <Image
                          src={item.src}
                          alt={item.alt}
                          width={24}
                          height={24}
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </div>
              <Button className="w-[183px] h-[40px] bg-[#ECC100] text-[#9C4846] font-[Shrikhand] rounded-full ml-3 text-[16px]">join waitlist</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Section1 */}
      <div className="h-[440px] md:h-[560px] flex flex-col items-center bg-[#F8F3F3] mt-2 section pt-[40px] sm:pt-[60px] section1">
        <div className="flex items-center">
          <Image
              src="/symbol.png" // Path to the image in the public directory
              alt="SODAX Symbol"
              width={32} // Set the width of the image
              height={32} // Set the height of the image
            />
          <span className="text-[24px] md:text-[42px] font-[InterBlack] ml-5">Savings product filler</span>
        </div>
        <Label className='text-[18px] font-[InterRegular] text-[#483534]'>Banner description</Label>
        <div className="mt-4">
          <Button className="mr-2 bg-[#CC9E9A] rounded-full w-[133px] h-[40px]">Main CTA</Button>
          <Button className="bg-[transparent] border-4 rounded-full w-[152px] h-[40px] text-[#483534]">Secondary CTA</Button>
        </div>
      </div>

      {/* Section2 */}
      <div className="h-[440px] md:h-[560px] flex flex-col items-center bg-[#F8F3F3] mt-2 pt-[40px] sm:pt-[60px] section2">
        <div className="flex items-center">
          <Image
              src="/symbol.png" // Path to the image in the public directory
              alt="SODAX Symbol"
              width={32} // Set the width of the image
              height={32} // Set the height of the image
            />
          <span className="text-[24px] md:text-[42px] font-[InterBlack] ml-5">Swaps product filler</span>
        </div>
        <Label className='text-[18px] font-[InterRegular] text-[#483534]'>Banner description</Label>
        <div className="mt-4">
          <Button className="mr-2 bg-[#CC9E9A] rounded-full w-[133px] h-[40px]">Main CTA</Button>
          <Button className="bg-[transparent] border-4 rounded-full w-[152px] h-[40px] text-[#483534]">Secondary CTA</Button>
        </div>
      </div>

      {/* Section3 */}
      <div className="flex flex-col lg:flex-row">
        <div className="w-full lg:w-1/2 flex flex-col items-center pt-[40px] sm:pt-[60px] radial-gradient-bg section-3-1 h-[440px] sm:h-[480px] mt-2">
          <div className="flex items-center">
            <Image
              src="/symbol4.png"
              alt="SODAX Symbol"
              width={32}
              height={32}
            />
            <span className="text-[24px] md:text-[32px] font-[InterBlack] ml-5 text-[#FF9048]">Sonic Summit</span>
          </div>
          <Label className='text-[14px] font-[InterRegular] text-white'>Update copy to reflect the event took place.</Label>
          <div className="mt-4">
            <Button className="mr-2 bg-white rounded-full w-[133px] h-[40px] text-black">Main CTA</Button>
            <Button className="bg-[transparent] border-4 rounded-full w-[152px] h-[40px] text-white">Secondary CTA</Button>
          </div>
          <Label className='text-[17px] font-bold font-[InterRegular] text-[#CC9E9A] mt-16'>6-8 Vienna</Label>
          <Label className='text-[46px] font-bold font-[InterRegular] text-[#FF9048] leading-none'>MAY</Label>
        </div>
        <div className="w-full lg:w-1/2 flex flex-col items-center section-3-2 pt-[40px] sm:pt-[60px] bg-[#ECC100]  h-[440px] sm:h-[480px] mt-2 lg:ml-2">
          <div className="flex items-center">
            <Image
              src="/symbol1.png"
              alt="SODAX Symbol"
              width={32}
              height={32}
            />
            <span className="text-[24px] md:text-[32px] font-[InterBlack] ml-5 text-[#9C4846]">Level up!</span>
          </div>
          <Label className='text-[14px] font-[InterRegular] text-black'>Points with every order.</Label>
          <div className="mt-4">
            <Button className="w-[183px] h-[40px] bg-white text-[#9C4846] font-[Shrikhand] rounded-full ml-3 text-[16px]">join waitlist</Button>
          </div>
        </div>
      </div>

      {/* Section4 */}
      <div className="h-[440px] md:h-[560px] flex flex-col items-center bg-[#A55C55] mt-2 section pt-[40px] sm:pt-[60px] section4">
        <div className="flex items-center">
          <Image
              src="/symbol.png" // Path to the image in the public directory
              alt="SODAX Symbol"
              width={32} // Set the width of the image
              height={32} // Set the height of the image
            />
          <span className="text-[24px] md:text-[42px] font-[InterBlack] ml-5 text-[#FFD92F]">Not gas, but fire</span>
        </div>
        <Label className='text-[12px] md:text-[18px] font-[InterRegular] text-white'>All platform and partner fees burn $SODA supply.</Label>
        <div className="mt-4">
          <Button className="mr-2 bg-white rounded-full w-[133px] h-[40px] text-black">Main CTA</Button>
          <Button className="bg-[transparent] border-4 rounded-full w-[152px] h-[40px] text-white">Secondary CTA</Button>
        </div>
      </div>

      {/* Section5 */}
      <div className="flex flex-col lg:flex-row">
        <div className="w-full lg:w-1/2 flex flex-col items-center pt-[40px] sm:pt-[60px] bg-[#A55C55] section-5-1 h-[440px] sm:h-[480px] mt-2">
          <div className="flex items-center">
            <Image
              src="/symbol.png"
              alt="SODAX Symbol"
              width={32}
              height={32}
            />
            <span className="text-[24px] md:text-[32px] font-[InterBlack] ml-5 text-[#FFD92F]">Reliable liquidity</span>
          </div>
          <Label className='text-[14px] font-[InterRegular] text-white'>Owned by us. There for you.</Label>
          <div className="mt-4">
            <Button className="mr-2 bg-white rounded-full w-[133px] h-[40px] text-black">Main CTA</Button>
            <Button className="bg-[transparent] border-4 rounded-full w-[152px] h-[40px] text-white">Secondary CTA</Button>
          </div>
        </div>
        <div className="w-full lg:w-1/2 flex flex-col items-center pt-[40px] sm:pt-[60px] bg-[#A55C55] section-5-2 h-[440px] sm:h-[480px] mt-2 lg:ml-2">
          <div className="flex items-center">
            <Image
              src="/symbol.png"
              alt="SODAX Symbol"
              width={32}
              height={32}
            />
            <span className="text-[24px] md:text-[32px] font-[InterBlack] ml-5 text-[#FFD92F]">13 chains in seconds</span>
          </div>
          <Label className='text-[14px] font-[InterRegular] text-white'>The best value. Delivered with Intents.</Label>
          <div className="mt-4">
            <Button className="mr-2 bg-white rounded-full w-[133px] h-[40px] text-black">Main CTA</Button>
            <Button className="bg-[transparent] border-4 rounded-full w-[152px] h-[40px] text-white">Secondary CTA</Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="h-[560px] flex lg:justify-center mt-2 bg-[#F8F3F3] footer pt-[80px]">
        <div className="p-4 copy-right">
          <div className="flex items-center">
            <Image
                src="/symbol2.png" // Path to the image in the public directory
                alt="SODAX Symbol"
                width={32} // Set the width of the image
                height={32} // Set the height of the image
              />
            <span className="ml-2 font-black text-2xl text-[#CC9E8A]">SODAX</span>
          </div>
          <div>
            <Label className='text-[12px] font-[InterMedium] text-[#CC9E8A] mt-5'>© 2025 ICON Foundation. All rights reserved.</Label>
          </div>
        </div>
        <div className="flex justify-around mt-4 menu-list">
          <div className='list'>
            <Label className='font-[Shrikhand] text-[16px] text-[#CC9E9A]'>using soda</Label>
            <ul className=''>
              <Link href="/dashboard">Flagship Platform (Soon)</Link>
              <Link href="/dashboard">Hana Wallet</Link>
              <Link href="/dashboard">Balanced DeFi</Link>
            </ul>
          </div>
          <div className='list'>
            <Label className='font-[Shrikhand] text-[16px] text-[#CC9E9A]'>socials</Label>
            <ul className=''>
              <Link href="/dashboard">Blog</Link>
              <Link href="/dashboard">Discord</Link>
              <Link href="/dashboard">X (Twitter)</Link>
              <Link href="/dashboard">Linktree</Link>
            </ul>
          </div>
          <div className='list'>
            <Label className='font-[Shrikhand] text-[16px] text-[#CC9E9A]'>resources</Label>
            <ul className=''>
              <Link href="/dashboard">Business Development</Link>
              <Link href="/dashboard">Contact Us</Link>
              <Link href="/dashboard">Media Kit</Link>
              <Link href="/dashboard">Disclaimer</Link>
              <Link href="/dashboard">Terms & Conditions</Link>
            </ul>
          </div>
          <div className='list'>
            <Label className='font-[Shrikhand] text-[16px] text-[#CC9E9A]'>more</Label>
            <ul className=''>
              <Link href="/dashboard">CMC</Link>
              <Link href="/dashboard">Binance Square</Link>
              <Link href="/dashboard">DefiLlama</Link>
            </ul>
          </div>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="min-h-[480px] bg-[#CC9E9A] bg-no-repeat bg-contain bg-center bg-bottom py-[80px] dialog-content"
        >
          <DialogHeader>
            <div className="flex justify-center">
              <Image
                src="/symbol.png" // Path to the image in the public directory
                alt="SODAX Symbol"
                width={64} // Set the width of the image
                height={64} // Set the height of the image
              />
            </div>
            <DialogTitle className="text-center text-white text-[42px] mt-4 font-[InterBlack]">SHAKE IT UP!</DialogTitle>
            <DialogDescription className="text-center text-white text-base">
              SODAX Rewards Coming Soon.
            </DialogDescription>
          </DialogHeader>
          <div className="grid">
            <div className="flex justify-center">
              <Input
                placeholder="Add your X handle"
                className="border border-white h-[36px] w-full max-w-[280px] rounded-full border-4 border-white text-center custom-placeholder"
              />
            </div>
          </div>
          <DialogFooter>
            <div className="flex justify-center items-center w-full">
              <Button
                type="button"
                className="bg-[#FFD92F] w-[188px] h-[40px] text-[#A55C55] rounded-full font-[Shrikhand]"
              >
                Pre-register
              </Button>
            </div>
          </DialogFooter>
          <div className="flex items-center justify-center space-x-2">
            <Checkbox id="terms" className='rounded-full bg-white'/>
            <Label htmlFor="terms" className='text-white'>Accept terms and conditions</Label>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPage;
