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
        <DialogContent className="min-h-[480px] bg-Cherry-bright bg-[url('/circle.png')] bg-no-repeat bg-center bg-bottom py-[80px] w-[90%] lg:max-w-[952px] dialog-content">
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
                className="border border-white h-[36px] w-full max-w-[280px] rounded-full border-4 border-white text-center placeholder-white"
              />
            </div>
          </div>
          <DialogFooter>
            <div className="flex justify-center items-center w-full">
              <Button
                type="button"
                className="bg-Yellow-soda w-[188px] h-[40px] text-Cherry-soda rounded-full font-[Shrikhand]"
              >
                Pre-register
              </Button>
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
