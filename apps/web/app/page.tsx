'use client';

import { useEffect, useState } from 'react';
import HeroSection from './herosection';
import Section1 from './section1';
import Section2 from './section2';
import Section3 from './section3';
import Section4 from './section4';
import Section5 from './section5';
import Section6 from './section6';
import Footer from './footer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

const LandingPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    setIsDialogOpen(true);
  }, []);

  return (
    <div>
      <HeroSection toggle={toggle} isOpen={isOpen} />
      <Section1 />
      <Section2 />
      <Section3 />
      <Section4 />
      <Section5 />
      <Section6 />
      <Footer />

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="min-h-[480px] bg-cherry-bright bg-[url('/circle.png')] bg-no-repeat bg-center bg-bottom py-[80px] w-[90%] lg:max-w-[952px] dialog-content">
          <DialogHeader>
            <div className="flex justify-center">
              <Image
                src="/symbol.png"
                alt="SODAX Symbol"
                width={64}
                height={64}
              />
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
              <input
                placeholder="Add your X handle"
                className="border border-white h-[36px] w-full max-w-[280px] text-cream rounded-full border-4 border-white text-center placeholder-white"
              />
            </div>
          </div>
          <DialogFooter>
            <div className="flex justify-center items-center w-full">
              <div className="inline-flex justify-center items-start">
                <Button className="w-[183px] h-[40px] bg-yellow-dark hover:bg-yellow-dark/80 text-cherry-dark font-[Shrikhand] rounded-full ml-0 mt-[20px] sm:ml-3 sm:mt-[0px] text-[16px] z-10">
                  Pre-register
                </Button>
                <div className="w-4 h-6 relative">
                  <div className="w-2 h-2 left-[7px] top-[10px] absolute bg-yellow-dark rounded-full" />
                  <div className="w-1 h-1 left-[9px] top-[-8px] absolute bg-yellow-dark rounded-full" />
                  <div className="w-1.5 h-1.5 left-[0px] top-[-2px] absolute bg-yellow-dark rounded-full" />
                  <div className="w-1 h-1 left-[12px] top-[1px] absolute bg-yellow-dark rounded-full" />
                </div>
             </div>
            </div>
          </DialogFooter>
          <div className="flex items-center justify-center space-x-2">
            <Checkbox id="terms" className="rounded-full bg-white" />
            <Label htmlFor="terms" className="text-white">
              Accept terms and conditions
            </Label>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPage;
