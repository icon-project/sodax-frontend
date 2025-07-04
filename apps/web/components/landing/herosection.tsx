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
import { useWallet } from '../../hooks/useWallet';
import { Notification } from '../Notification';
import ConnectWalletButton from '@/components/ui/connect-wallet-button';

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

  useEffect(() => {
    if (isConnected && !hasBeenConnected) {
      onRewardDialogChange(true);
      setHasBeenConnected(true);
    }
  }, [isConnected, hasBeenConnected, onRewardDialogChange]);

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
                onClick={() => onRewardDialogChange(true)}
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
                <DecoratedButton onClick={() => onRewardDialogChange(true)} isConnected={isConnected}>
                  join waitlist
                </DecoratedButton>
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
            <DialogContent className="h-[480px] bg-cherry-bright bg-[url('/circle.png')] bg-no-repeat bg-center bg-bottom py-[80px] w-[90%] lg:max-w-[952px] dialog-content transform translate-y-[-65%] lg:mt-0">
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
                    <ConnectWalletButton
                      onWalletClick={handleWalletClick}
                      isRegistering={!isFormValid}
                      onCloseRewardDialog={() => onRewardDialogChange(false)}
                      onOpenRewardDialog={() => onRewardDialogChange(true)}
                    ></ConnectWalletButton>
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
                            Acceptance of the Terms of Use; Eligible Users
                            <br /> These terms of use are entered into by and between you (as defined below) and ICON
                            Foundation (“Company”, “we” or “us”). The following terms and conditions, together with any
                            documents they expressly incorporate by reference (collectively, these “Terms of Use”),
                            govern your access to and use of sodax.com and any subdomains thereof (the “Services”) and
                            use of our mobile applications (the “Apps” and together with the Services, the “Services”).
                          </p>
                          <p>
                            If the user engages with the Services under authority from a different party or on another
                            party’s behalf, then “you” (and its variants, including “your”, “yours”, etc.) as used
                            herein refers to that person on whose behalf the Services are used (e.g., an employer). If
                            the person engaging with our Services is an individual, acting in their own individual
                            capacity, then “you” (and its variants) refers to that individual. If you have anyone using
                            the Services on your behalf, you agree that you are responsible for the actions and
                            inactions of all such persons, as they were your own.
                          </p>
                          <p>
                            The Services provide access to third-party content, protocols and software, including smart
                            contracts, which may enable you to convert your native tokens into wrapped tokens, bridge
                            tokens to additional chains, swap other collateral for stablecoins, and/or engage in other
                            blockchain-based assets (“Digital Assets”) trading activities. USE OF THE PROTOCOL OR
                            CONNECTED SMART CONTRACTS ARE AT YOUR OWN RISK. THE SERVICES ARE A NON-EXCLUSIVE MEANS TO
                            FACILITATE ACCESS TO THE RELEVANT PROTOCOL AND/OR SMART CONTRACTS. WE DO NOT OWN, CONTROL,
                            OR HAVE ANY RESPONSIBILITY FOR THE SODA PROTOCOL OR THE SODAX SMART CONTRACTS. THESE TERMS
                            OF USE DO NOT GOVERN YOUR USE OF THE PROTOCOL OR THE SODAX SMART CONTRACTS, WHICH ARE
                            CONTROLLED, MAINTAINED AND/OR OPERATED BY THIRD PARTIES. PLEASE CONSULT SUCH THIRD PARTIES’
                            TERMS AND CONDITIONS OR OTHER USER AGREEMENTS FOR INFORMATION REGARDING YOUR RIGHTS AND
                            RISKS ASSOCIATED WITH YOUR USE OF AND ACCESS TO THE FOREGOING.
                          </p>
                          <p>
                            YOU AGREE THAT DISPUTES (AS DEFINED BELOW) ARISING OUT OF OR RELATED TO THESE TERMS OF USE
                            OR THE SERVICES WILL BE RESOLVED BY BINDING INDIVIDUAL ARBITRATION, AND BY ACCEPTING THESE
                            TERMS OF USE, YOU AND COMPANY ARE EACH WAIVING THE RIGHT TO A TRIAL BY JURY OR TO
                            PARTICIPATE IN ANY CLASS ACTION OR REPRESENTATIVE PROCEEDING.
                          </p>
                          <p>
                            Please read these Terms of Use carefully before you start to use the Services. By using the
                            Services, you accept and agree to be bound and abide by these Terms of Use. In addition, by
                            clicking “I agree” (or a similar language) to these Terms of Use, acknowledging these Terms
                            of Use by other means, or otherwise accessing or using the Services, you also accept and
                            agree to be bound by and to comply with these Terms of Use. If you do not want to agree to
                            these Terms of Use, you must not access or use the Services.
                          </p>
                          <p>
                            BY USING THE SERVICES, YOU ACKNOWLEDGE, UNDERSTAND AND AGREE THAT (i) YOU ARE NOT PERMITTED
                            TO MODIFY, DISASSEMBLE, DECOMPILE, ADAPT, ALTER, TRANSLATE, REVERSE ENGINEER OR CREATE
                            DERIVATIVE WORKS OF THE SERVICES TO MAKE IT AVAILABLE TO ANY BLOCKED PERSONS OR RESTRICTED
                            PERSONS; AND (ii) WE DO NOT AND WILL NOT HAVE CONTROL OVER THE DEVELOPMENT, GROWTH,
                            MAINTENANCE OR OPERATIONS OF ANY PROTOCOL OR SMART CONTRACT THAT YOU MAY BE ABLE TO ACCESS
                            FROM OR THROUGH THE SERVICES, OR THEIR UNDERLYING SOFTWARE.
                          </p>
                          <p>
                            YOU ACKNOWLEDGE, UNDERSTAND AND AGREE THAT NOTHING ON OR THROUGH THE SERVICES (INCLUDING
                            REFERENCES OR LINKS TO SPECIFIC SOFTWARE, PROTOCOLS, SMART CONTRACTS AND/OR DIGITAL ASSETS)
                            SHALL BE CONSIDERED OR SEEN AS PROMOTIONAL OR MARKETING CONTENT FOR SUCH SOFTWARE,
                            PROTOCOLS, SMART CONTRACTS AND/OR DIGITAL ASSETS, AND WE ARE NOT ENDORSING, ADVERTISING,
                            PROMOTING, OR OTHERWISE MAKING KNOWN OR AVAILABLE SUCH SOFTWARE, PROTOCOLS, SMART CONTRACTS
                            AND/OR DIGITAL ASSETS IN ANY SPECIFIC JURISDICTION OR INVITING OR INDUCING ANYONE TO ENGAGE
                            IN ANY TYPE OF CONDUCT OR ACTIVITY IN CONNECTION WITH SUCH SOFTWARE, PROTOCOLS, SMART
                            CONTRACTS AND/OR DIGITAL ASSETS.
                          </p>
                          <p>
                            The Services are offered and available to users who are 18 years of age or older and who are
                            not Blocked Persons or Restricted Persons. By using the Services, you represent and warrant
                            that you are of legal age to form a binding contract with Company pursuant to applicable
                            laws, and meet all of the foregoing eligibility requirements. If you do not meet all of
                            these requirements, you must not access or use the Services.
                          </p>
                          <p>
                            Changes to the Terms of Use
                            <br /> We may revise and update these Terms of Use from time to time in our sole discretion.
                            All changes are effective immediately when we post them, and apply to all access to and use
                            of the Services thereafter.
                          </p>
                          <p>
                            Your continued use of the Services following the posting of revised Terms of Use means that
                            you accept and agree to the changes. You are expected to check this page each time you
                            access the Services so you are aware of any changes, as they are binding on you.
                          </p>
                          <p>
                            Accessing the Services and Account Security
                            <br /> We reserve the right to withdraw or amend the Services, and any service or material
                            we provide on the Services, in our sole discretion without notice. We will not be liable if
                            for any reason all or any part of the Services are unavailable at any time or for any
                            period. From time to time, we may restrict access to some parts of the Services, or all of
                            the Services, to users.
                          </p>
                          <p>
                            You are responsible for:
                            <br /> Making all arrangements necessary for you to have access to the Services. Ensuring
                            that all persons who access the Services through your internet connection or on your behalf
                            are aware of these Terms of Use and comply with foregoing.
                          </p>
                          <p>
                            We have the right to disable your access to the Services at any time in our sole discretion
                            for any or no reason, including if, in our opinion, you have violated any provision of these
                            Terms of Use or are violating any applicable law.
                          </p>
                          <p>
                            Trademarks
                            <br /> Company’s name, the terms “SODAX” and “Soda Xchange”, Company’s logos, and all
                            related names, logos, product and service names, designs, and slogans are trademarks of
                            Company or Company’s licensors. You must not use such marks without the prior written
                            permission of Company or Company’s licensors, as applicable.
                          </p>
                          <p>
                            Use of Open-Source Software and Certain Services
                            <br /> The Services use open-source software developed by third-party collaborators, which
                            are independent from and unaffiliated with Company. Any use of this software is subject to
                            the terms and conditions laid out herein.
                          </p>
                          <p>
                            You agree only to use this software in accordance with, and comply with the open-source
                            licenses related to each software.
                          </p>
                          <p>
                            Prohibited Uses
                            <br /> You may use the Services only for lawful purposes and in accordance with these Terms
                            of Use. You agree not to use the Services: In any way that violates any applicable federal,
                            state, local, or international law or regulation (including, without limitation, any laws
                            regarding the export of data or software to and from the United States, Canada, European
                            Union, the United Kingdom (collectively "Limited Jurisdictions") or other countries).
                            <br /> For the purpose of exploiting, harming, or attempting to exploit or harm minors in
                            any way by exposing them to inappropriate content, asking for personally identifiable
                            information, or otherwise.
                            <br /> To send, knowingly receive, upload, download, use, or re-use any material that does
                            not comply with these Terms of Use. To transmit, or procure the sending of, any advertising
                            or promotional material, including any “junk mail”, “chain letter”, “spam”, or any other
                            similar solicitation.
                            <br /> To impersonate or attempt to impersonate Company, a Company employee or
                            representative, another user, or any other person or entity (including, without limitation,
                            by using identifiers associated with any of the foregoing).
                            <br /> To engage in any other conduct that restricts or inhibits anyone’s use or enjoyment
                            of the Services, or which, as determined by us, may harm Company or users of the Services or
                            expose them to liability.
                            <br /> Additionally, you agree not to: <br /> Allow any third party to access the Services
                            on your behalf or using your credentials. Accessing or attempting to access restricted
                            portions of the Services, security software or other administrative applications associated
                            therewith.
                            <br />
                            Use the Services in any manner that could disable, overburden, damage, or impair the
                            Services or interfere with any other party’s use of the Services, including their ability to
                            engage in real time activities through the Services.
                            <br /> Use any robot, spider, or other automatic device, process, or means to access the
                            Services for any purpose, including monitoring the Services.
                            <br /> Use any manual process to monitor the Services or for any other unauthorized purpose
                            without our prior written consent. Use any device, software, or routine that interferes with
                            the proper working of the Services.
                            <br /> Use, transmit, introduce or install any code, files, scripts, agents or programs
                            intended to do harm or allow unauthorized access, including, for example, viruses, worms,
                            time bombs, back doors and Trojan horses (collectively, “Malicious Code”) on or through the
                            Services, or accessing or attempting to access the Services for the purpose of infiltrating
                            a computer or computing system or network, or damaging the software components of the
                            Services, or the systems of the hosting provider, any other suppliers or service provider
                            involved in providing the Services, or another user.
                            <br /> Distribute Malicious Code or other items of a destructive or deceptive nature.
                            <br /> Attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts
                            of the Services, the server on which the Services are stored, or any server, computer, or
                            database connected to the Services.
                            <br /> Copy, mirror or otherwise attempt to replicate or reproduce the Services in breach of
                            these Terms of Use.
                            <br /> Attack the Services via a denial-of-service attack or a distributed denial-of-service
                            attack.
                            <br /> Use the Services as a tool to commit theft, fraud or any other property crime.
                            <br /> Use the Services for, or in connection with, any products, services, or materials
                            that constitute, promote, or are used primarily for the purpose of dealing in phishing,
                            spyware, adware, or other malicious programs or code, counterfeit goods, items subject to
                            applicable jurisdictions’ embargoes, hacking, stolen products, and items used for theft,
                            hazardous materials, or any illegal activities. Pose as another person or entity without
                            authorization.
                            <br />
                            Use a wallet other than your own (without authorization) to engage in a transaction.
                            <br /> Use the Services, directly or indirectly, for or in connection with money laundering,
                            terrorist financing, or other illicit financial activity.
                            <br /> Use the Services, directly or indirectly, for, on behalf of, for the benefit of, or
                            in connection with any Blocked Persons, Restricted Persons, and/or Restricted Jurisdictions.
                            <br /> Use the Services to carry out any financial activities subject to registration or
                            licensing.
                            <br /> Use the Services to engage in price manipulation, fraud, or other deceptive,
                            misleading, or manipulative activity. Otherwise attempt to interfere with the proper working
                            of the Services.
                          </p>
                          <p>
                            Reliance on Information Posted The information presented on or through the Services is made
                            available solely for general information purposes. We do not warrant the accuracy,
                            completeness, or usefulness of this information. Any reliance you place on such information
                            is strictly at your own risk. We disclaim all liability and responsibility arising from any
                            reliance placed on such materials by you or any other visitor to the Services, or by anyone
                            who may be informed of any of its contents.
                          </p>
                          <p>
                            The Services may include content provided by third parties, including materials provided by
                            the owners and operators of blockchain protocols and software.
                          </p>
                          <p>
                            The Services provides access to third party on-chain tools, including potentially a
                            decentralized trading protocol and/or a bridge smart contract related to the same. You
                            acknowledge and agree that such protocol and bridge smart contract are controlled,
                            maintained and/or operated by third parties, and we do not own, operate, provide, control,
                            or have any responsibility for such protocol or smart contract. Please consult such third
                            parties’ user agreements for information regarding your use of and access to the protocol
                            and the smart contract.
                          </p>
                          <p>
                            Changes to the Services
                            <br /> We may update the content on the Services from time to time, but such content is not
                            necessarily complete or up-to-date. Any of the material on the Services may be out of date
                            at any given time, and we are under no obligation to update such material.
                          </p>
                          <p>
                            Blockchain Transactions and Exchange of Crypto Assets
                            <br /> The Services allow you access to on-chain protocols or other methods of transacting
                            in Digital Assets. That functionality is not provided by Company, and we do not control it.
                            Our Services make such functionalities accessible only as a convenience to you.
                          </p>
                          <p>
                            You understand that we do not hold your Digital Assets, and take no custody of them. We have
                            no access to your assets or funds. It is your responsibility to ensure that you maintain
                            control of your Digital Assets and you have sole responsibility for exchanging them
                            (including through the Services).
                          </p>
                          <p>
                            Any losses you suffer as a result of your crypto asset transactions and exchanges is your
                            responsibility and you hereby indemnify us, agree to defend us, and hold us harmless against
                            any claims or losses that you or anyone else suffer as a result of your crypto asset
                            transactions, even if you initiated your transaction by accessing our Services.
                          </p>
                          <p>
                            You also understand that, by using the Services, you may be interacting with other third
                            parties that are independent from and unaffiliated with us. In particular, you understand
                            and acknowledge that, in order to successfully interact with on-chain protocols and transact
                            in Digital Assets via our Services, you will need to rely on services provided by third
                            parties, including (but not limited to) remote procedure call node (“RPC node”) operators.
                            An RPC node is a type of computer server that allows users to read data from and send
                            transactions to a blockchain network. We do not operate any RPC nodes and are not
                            responsible for the operation of any RPC nodes required for your successful interaction with
                            on-chain protocols or transacting in Digital Assets. Any RPC nodes that you rely on or use
                            are independent from and unaffiliated with Company and Company shall not be held liable for
                            the operation of any RPC nodes or the function or service to be performed by those RPC
                            nodes.
                          </p>
                          <p>
                            You also understand that we do not act as your financial advisors or give you any investment
                            advice of any kind with respect to your use or exchange of Digital Assets. As with any
                            trading activities, it is your responsibility and you are solely responsible for the
                            contents of your wallet, your exchange decisions, how and when you trade Digital Assets and
                            with whom. It is also your responsibility to ensure you understand crypto assets, how they
                            work, what their value is, and how to trade such assets, as there are significant risks in
                            doing so, all of which you solely assume.
                          </p>
                          <p>
                            You acknowledge that the time of a Digital Asset transaction can affect the value of the
                            asset or the fees associated with a transaction or both. You hereby agree that you hold us
                            harmless against any and all claims arising from the transactions of your Digital Assets, or
                            the timing of such transactions.
                          </p>
                          <p>
                            Digital Assets are not subject to deposit and/or securities insurance or protection regimes.
                            Company is not a bank, and we have no fiduciary duty to you.
                          </p>
                          <p>
                            Our Services may be subject to expropriation and/or theft. Hackers or other malicious actors
                            may attempt to interfere with our Services or your use thereof in a variety of ways,
                            including, but not limited to, use of Malicious Code, denial of service attacks, sybil
                            attacks, and spoofing. Furthermore, because much of our Services rely on open-source
                            software, there is the software underlying our code that may contain bugs or weaknesses
                            which may negatively affect the Services, or result in the loss of your Digital Assets, or
                            your ability to control your wallet. You hold us harmless from and against any losses you
                            suffer as a result of such issues.
                          </p>
                          <p>
                            You acknowledge that the Services may use, incorporate or link to certain open-source
                            components and you agree that your use of the Services are subject to, and you will comply
                            with any, applicable open-source licenses governing any such open-source components.
                          </p>
                          <p>
                            All decisions you make based on information provided through the Services are your sole
                            responsibility and you hold us harmless from and against any losses you suffer as a result
                            of such decisions. The Services provide access to materials and tools offered by or created
                            by third parties, such as Digital Asset protocols or smart contracts. We do not control such
                            materials, and provide no guarantee as to their accuracy, completeness, legality or
                            usefulness. You acknowledge and agree that we are not responsible for any aspect of the
                            information, content, or services contained in any such third-party materials comprising the
                            backend of, or accessible from or linked to, the Services.
                          </p>
                          <p>
                            By utilizing or interacting with the Services in any way, you represent and warrant that you
                            understand the inherent risks associated with: cryptographic systems and blockchain-based
                            networks; Digital Assets, including the usage and intricacies of native Digital Assets, like
                            SODAX (SODA); smart contract-based tokens; and systems that interact with blockchain-based
                            networks.
                          </p>
                          <p>
                            You acknowledge and understand that cryptography is a progressing field with advances in
                            code cracking or other technical advancements, such as the development of quantum computers,
                            which may present risks to Digital Assets and the smart contract to which the Services
                            facilitate access, and could result in the theft or loss of your Digital Assets. We are
                            unable to update the smart contracts and software to which the Services provide access for
                            any advances in cryptography or to incorporate additional security measures necessary to
                            address risks presented from technological advancements; thus, there can be no guarantee
                            regarding the security of smart contracts and/or software or protocols to which the Services
                            facilitate access.
                          </p>
                          <p>
                            You agree and understand that all investment decisions are made solely by you. You agree and
                            understand that under no circumstances will the operation of the Services and your use of it
                            be deemed to create a relationship that includes the provision of or tendering of investment
                            advice. NO FINANCIAL, INVESTMENT, TAX, LEGAL OR SECURITIES ADVICE IS GIVEN THROUGH OR IN
                            CONNECTION WITH OUR SERVICES. No content found on the Services, whether created by us, a
                            third party, or another user is or should be considered as investment advice. You agree and
                            understand that we accept no responsibility whatsoever for, and shall in no circumstances be
                            liable in connection with, your decisions or your use of our Services. Nothing contained in
                            the Services constitutes a solicitation, recommendation, endorsement, or offer by us or any
                            third party to transact in any Digital Assets, securities, or other financial instruments.
                            Neither we nor any of our affiliates has endorsed or sponsored any Digital Assets made
                            available or that can be transacted through third-party tools available from the Services.
                          </p>
                          <p>
                            You understand and accept that, in connection with your use of the Services, you may be
                            required to pay fees necessary for interacting with blockchain software, including (without
                            limitation) “gas” costs, and you understand that you are solely responsible for paying such
                            fees and costs and that none of such fees or costs will be paid to Company or Company’s
                            affiliates.
                          </p>
                          <p>
                            Taxes and Fraud
                            <br /> Depending on your location of residence, you may owe taxes on amounts you earn after
                            exchanging assets, including Digital Assets and crypto assets. It is your responsibility to
                            ensure you have accounted for, reported to the proper governmental authority, and paid all
                            such taxes to the applicable governmental authority. We do not undertake any obligation to
                            report any such taxes, nor collect or disburse them on your behalf. The taxes you owe are
                            solely your responsibility. You hold us harmless and release us from and against any claims,
                            losses, damages or demands arising in connection with taxes you may owe as a result of your
                            transactions on the Services.
                          </p>
                          <p>
                            If we believe that you have engaged in or been a participant in any fraudulent transaction,
                            we reserve the right to take any action we think appropriate, including forwarding your
                            information and information about the transactions we believe or suspect to be fraudulent to
                            applicable law enforcement agencies, which may result in civil or criminal penalties or
                            other actions against you.
                          </p>
                          <p>
                            Linking to the Services and Social Media Features
                            <br /> You may link to our Website’s homepage, provided you do so in a way that is fair and
                            legal and does not damage our reputation or take advantage of it, but you must not establish
                            a link in such a way as to suggest any form of association, approval, or endorsement on our
                            part without our express written consent in each instance.
                          </p>
                          <p>
                            The Services may provide certain social media features that enable you to:
                            <br /> Link from your own or certain third-party websites to certain content on the
                            Services.
                            <br />
                            Send emails or other communications with certain content, or links to certain content, on
                            the Services.
                            <br /> Cause limited portions of content on the Services to be displayed or appear to be
                            displayed on your own or certain third-party websites.
                          </p>
                          <p>
                            You may use these features solely as they are provided by us and solely with respect to the
                            content they are displayed with and otherwise in accordance with any additional terms and
                            conditions we provide with respect to such features. Subject to the foregoing, you must not:
                            <br />
                            Establish a link from any website that is not owned by you.
                            <br /> Cause the Services or portions of it to be displayed on, or appear to be displayed
                            by, any other site, for example, framing, deep linking, or in-line linking.
                            <br /> Link to any part of the Services other than the homepage, bridge subdomain, and
                            documentation subdomains. Otherwise take any action with respect to the materials on the
                            Services that is inconsistent with any other provision of these Terms of Use.
                          </p>
                          <p>
                            You agree to cooperate with us in immediately stopping any unauthorized framing or linking.
                            We reserve the right to withdraw linking permission without notice.
                          </p>
                          <p>
                            We may disable all or any social media features and any links at any time without notice in
                            our discretion.
                          </p>
                          <p>
                            Third-Party Materials; Links from the Services
                            <br /> The Services may include services and content provided by third parties, including
                            (without limitation) materials provided by other users, and third-party licensors and
                            service providers. If you have any questions about the policies and practices of such
                            third-party service providers, please consult their respective terms and conditions.
                          </p>
                          <p>
                            If the Services contain links to and access to third-party content and resources, these
                            links are provided for your convenience only. This includes links contained in
                            advertisements, including banner advertisements and sponsored links, and Digital Asset
                            trading protocols, among other things. We have no control over the contents of those sites
                            or resources, and accept no responsibility for them or for any loss or damage that may arise
                            from your use of them. If you decide to access any of the third-party websites linked on the
                            Services, you do so entirely at your own risk and subject to the terms and conditions of use
                            for such websites.
                          </p>
                          <p>
                            IT MAY NOT BE APPARENT WHICH CONTENT, FUNCTIONALITY, AND/OR FEATURES ARE PROVIDED BY US
                            VERSUS BY THIRD PARTIES AND BY USING ANY PART OF THE SERVICES YOU HEREBY ASSUME ALL RISKS
                            ASSOCIATED WITH THE CONTENT, FUNCTIONALITY, AND/OR FEATURES MADE AVAILABLE ON OR THROUGH THE
                            SERVICES. WE ARE NOT RESPONSIBLE OR LIABLE TO YOU OR ANY THIRD PARTY FOR THE CONTENT,
                            FUNCTIONALITY, AND/OR FEATURES PROVIDED BY ANY THIRD PARTIES, AND YOU AGREE THAT YOU BEAR
                            SOLE AND ABSOLUTE RESPONSIBILITY TO EVALUATE AND SELECT ANY THIRD-PARTY FUNCTIONALITY WITH
                            WHICH YOU INTERACT, WHETHER INTENTIONALLY OR INCIDENTALLY, VIA THE SERVICES.
                          </p>
                          <p>
                            Disclaimer of Warranties
                            <br /> You understand that we cannot and do not guarantee or warrant that files available on
                            the internet or the Services will be free of Malicious Code. You are responsible for
                            implementing sufficient procedures and checkpoints to satisfy your particular requirements
                            for anti-virus protection and accuracy of data input and output, and for maintaining a means
                            external to our Services for any reconstruction of any lost data, including any information
                            in your wallet.
                          </p>
                          <p>
                            TO THE FULLEST EXTENT PERMITTED BY LAW, WE WILL NOT BE LIABLE FOR ANY LOSS OR DAMAGE CAUSED
                            BY A DISTRIBUTED DENIAL-OF-SERVICE ATTACK, VIRUSES, OR OTHER TECHNOLOGICALLY HARMFUL
                            MATERIAL THAT MAY INFECT YOUR COMPUTER EQUIPMENT, COMPUTER PROGRAMS, DATA, YOUR WALLET, OR
                            PROPRIETARY MATERIAL DUE TO YOUR USE OF THE SERVICES, YOUR TRANSACTIONS OR EXCHANGES THROUGH
                            TOOLS ACCESSED THROUGH THE SERVICES, OR YOUR ACCESS TO ANY MATERIAL, PROTOCOLS, SMART
                            CONTRACTS OR OTHER TOOLS PROVIDED ON OR THROUGH THE SERVICES, POSTED ON THEM, OR POSTED ON
                            ANY THIRD-PARTY CONTENT OR BLOCKCHAINS LINKED TO THE SERVICES.
                          </p>
                          <p>
                            YOUR USE OF THE SERVICES, THEIR CONTENT, AND ANY SERVICES OR ITEMS OBTAINED THROUGH THE
                            SERVICES IS AT YOUR OWN RISK. THE SERVICES, THEIR CONTENT, AND ANY SERVICE OR ITEMS OBTAINED
                            THROUGH THE SERVICES ARE PROVIDED ON AN “AS IS” AND “AS AVAILABLE” BASIS, WITHOUT ANY
                            WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. NEITHER COMPANY NOR ANY PERSON ASSOCIATED
                            WITH COMPANY MAKES ANY WARRANTY OR REPRESENTATION WITH RESPECT TO THE COMPLETENESS,
                            SECURITY, RELIABILITY, QUALITY, ACCURACY, OR AVAILABILITY OF THE SERVICES. WITHOUT LIMITING
                            THE FOREGOING, NEITHER COMPANY NOR ANYONE ASSOCIATED WITH COMPANY REPRESENTS OR WARRANTS
                            THAT THE SERVICES, THEIR CONTENT, OR ANY SERVICE OR ITEMS OBTAINED OR ACCESSIBLE THROUGH THE
                            SERVICES INCLUDING THE PROTOCOL AND ANY SMART CONTRACTS, WILL BE ACCURATE, RELIABLE,
                            ERROR-FREE, OR UNINTERRUPTED, THAT DEFECTS WILL BE CORRECTED, THAT OUR SERVICES OR THE
                            SERVER THAT MAKES THEM AVAILABLE ARE FREE OF MALICIOUS CODE OR OTHER HARMFUL COMPONENTS, OR
                            THAT THE SERVICES OR ANY SERVICES OR ITEMS OBTAINED OR ACCESSED THROUGH THE SERVICES WILL
                            OTHERWISE MEET YOUR NEEDS OR EXPECTATIONS.
                          </p>
                          <p>
                            TO THE FULLEST EXTENT PERMITTED BY LAW, COMPANY HEREBY DISCLAIMS ALL WARRANTIES OF ANY KIND,
                            WHETHER EXPRESS OR IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING BUT NOT LIMITED TO ANY
                            WARRANTIES OF MERCHANTABILITY, NON-INFRINGEMENT, AND FITNESS FOR PARTICULAR PURPOSE.
                          </p>
                          <p>
                            THE FOREGOING DOES NOT AFFECT ANY WARRANTIES THAT CANNOT BE EXCLUDED OR LIMITED UNDER
                            APPLICABLE LAW.
                          </p>
                          <p>
                            Limitation on Liability <br /> TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT WILL
                            COMPANY, ITS AFFILIATES, OR THEIR LICENSORS, SERVICE PROVIDERS, EMPLOYEES, AGENTS,
                            SHAREHOLDERS, OWNERS, MEMBERS, OFFICERS, OR DIRECTORS BE LIABLE FOR DAMAGES OF ANY KIND,
                            UNDER ANY LEGAL THEORY, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OR ACCESS TO, OR
                            INABILITY TO USE OR ACCESS, THE SERVICES, THE THIRD-PARTY PROTOCOL OR ANY SMART CONTRACTS
                            MADE ACCESSIBLE ON OR THROUGH THE SERVICES, ANY WEBSITES LINKED TO THE SERVICES, ANY CONTENT
                            ON THE SERVICES OR SUCH OTHER WEBSITES, INCLUDING ANY DIRECT, INDIRECT, SPECIAL, INCIDENTAL,
                            CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO, PERSONAL INJURY, PAIN AND
                            SUFFERING, EMOTIONAL DISTRESS, LOSS OF REVENUE, LOSS OF PROFITS, LOSS OF INCOME, LOSS OF
                            BUSINESS OR ANTICIPATED SAVINGS, LOSS OF USE, LOSS OF GOODWILL, LOSS OF DATA, AND WHETHER
                            CAUSED BY TORT (INCLUDING NEGLIGENCE), BREACH OF CONTRACT, OR OTHERWISE, EVEN IF
                            FORESEEABLE.
                          </p>
                          <p>
                            THE FOREGOING DOES NOT AFFECT ANY LIABILITY THAT CANNOT BE EXCLUDED OR LIMITED UNDER
                            APPLICABLE LAW.
                          </p>
                          <p>
                            Force Majeure
                            <br /> We shall not be liable or responsible to you, nor be deemed to have defaulted under
                            or breached these Terms of Use, for any failure or delay in performance when and to the
                            extent such failure or delay is caused by or results from acts beyond our reasonable
                            control, including but not limited to: acts of God, flood, fire, earthquake, epidemics,
                            pandemics, quarantine restrictions, explosion, war, terrorism, invasion, hostilities
                            (whether war is declared or not), civil unrest, riots, government action, embargoes or
                            blockades, sanctions, failure of public or private telecommunications networks or internet
                            services, power outages, denial of service attacks or other cyberattacks, failure of
                            third-party services (including decentralized protocols, blockchain networks, and RPC
                            nodes), strikes, labor stoppages or slowdowns, or other industrial disturbances, or other
                            events beyond our reasonable control. In such cases, our obligations under these Terms of
                            Use shall be suspended for so long as the event continues to impede our performance.
                          </p>
                          <p>
                            Indemnification
                            <br /> You agree to defend, indemnify, and hold harmless Company, its affiliates, licensors,
                            and service providers, and its and their respective officers, directors, employees,
                            contractors, agents, licensors, suppliers, successors, and assigns (each an “Indemnified
                            Party”) from and against any claims, liabilities, damages, judgments, awards, losses, costs,
                            expenses, or fees (including reasonable attorneys’ fees and legal costs) arising out of or
                            relating to your violation of these Terms of Use or your use of the Services.
                          </p>
                          <p>
                            Third Party Rights
                            <br /> Any Indemnified Party not being a party to these Terms of Use may enforce any rights
                            granted to it pursuant to these Terms of Use in its own right as if it were a party to these
                            Terms of Use. Unless expressly provided to the contrary in these Terms of Use, a person who
                            is not a party to these Terms of Use shall not have any rights under the Contracts (Rights
                            of Third Parties) Act (as amended) of the Cayman Islands to enforce any term of these Terms
                            of Use. Notwithstanding any term of these Terms of Use, the consent of or notice to any
                            person who is not a party to these Terms of Use shall not be required for any termination,
                            rescission or agreement to any variation, waiver, assignment, novation, release or
                            settlement under these Terms of Use at any time.
                          </p>
                          <p>
                            Governing Law and Dispute Resolution
                            <br /> PLEASE READ THIS SECTION CAREFULLY BECAUSE IT MAY SIGNIFICANTLY IMPACT YOUR LEGAL
                            RIGHTS, INCLUDING YOUR RIGHT TO BRING A LAWSUIT AGAINST COMPANY. THIS SECTION REQUIRES YOU
                            TO SUBMIT ANY CONTROVERSY, DISPUTE, CLAIM OR DISAGREEMENT (EACH A “DISPUTE”) ARISING OUT OF
                            THESE TERMS OF USE OR THE SERVICES, INCLUDING ANY DISPUTE THAT AROSE BEFORE THE EFFECTIVE
                            DATES OF THESE TERMS OF USE, TO BINDING INDIVIDUAL ARBITRATION. THIS SECTION EXTENDS TO
                            DISPUTES THAT AROSE OR INVOLVE FACTS OCCURING BEFORE THE EXISTENCE OF THIS SECTION OR ANY
                            PRIOR VERSIONS OF THESE TERMS OF USE AS WELL AS DISPUTES THAT MAY ARISE AFTER THE
                            TERMINATION OF THESE TERMS OF USE.
                          </p>
                          <p>
                            You and Company agree that any Dispute arising out of or related to these Terms of Use or
                            the Services is personal to you and Company, and that any Dispute will be resolved solely
                            through binding individual arbitration, and will not be brought as a class arbitration,
                            class action or any other type of representative proceeding.
                          </p>
                          <p>
                            All matters relating to the Services and these Terms of Use and any Dispute arising
                            therefrom or related thereto (in each case, including non-contractual Disputes), shall be
                            governed by and construed in accordance with the internal laws of the Cayman Islands without
                            giving effect to any choice or conflict of law provision or rule (whether of the Cayman
                            Islands or any other jurisdiction).
                          </p>
                          <p>
                            Any Dispute between the parties arising out of or relating to these Terms of Use shall be
                            settled by arbitration administered by the Cayman Islands Mediation & Arbitration Centre
                            (CI-MAC) in accordance with the Arbitration Act (as amended) of the Cayman Islands. The
                            arbitration shall be seated in George Town, Cayman Islands and shall be heard in the English
                            language and determined by a sole arbitrator. Any award or decision made by the arbitrator
                            shall be in writing and shall be final and binding on the parties, and judgment upon any
                            award thus obtained may be entered in or enforced by any court of competent jurisdiction.
                            You shall not institute any action at law or in equity based upon any claim arising out of
                            or related to these Terms of Use in any court. We retain the right to bring any suit,
                            action, or proceeding against you for breach of these Terms of Use in your country of
                            residence or any other relevant country. You waive any and all objections to the exercise of
                            jurisdiction over you by such courts and to venue in such courts. Notwithstanding the
                            foregoing, nothing in this section shall be construed to limit any right that cannot be
                            waived or limited by applicable law.
                          </p>
                          <p>
                            Limitation on Time to File Claims <br /> Any claim arising out of or relating to these Terms
                            of Use must be brought by you within 12 months of such claim arising, or your date of
                            knowledge of the facts founding such claim if later, and you hereby expressly agree to
                            exclude the effect of the Limitation Act (1996 Revision) in this regard.
                          </p>
                          <p>
                            You agree to the fullest extent permitted by law that no class or collective action can be
                            asserted in relation to these Terms of Use, and that all claims, whether in arbitration or
                            otherwise, arising out of or relating to these Terms of Use must be brought by you in your
                            individual capacity and not as a plaintiff or class member in any purported class or
                            collective proceeding.
                          </p>
                          <p>
                            Waiver and Severability
                            <br /> No waiver by Company of any term or condition set out in these Terms of Use shall be
                            deemed a further or continuing waiver of such term or condition or a waiver of any other
                            term or condition, and any failure of Company to assert a right or provision under these
                            Terms of Use shall not constitute a waiver of such right or provision nor shall it preclude
                            or restrict any further exercise of that or any other right or remedy.
                          </p>
                          <p>
                            The provisions of these Terms of Use shall be severable in the event that any of the
                            provisions hereof are held by a court of competent jurisdiction to be invalid, void or
                            otherwise unenforceable, and the remaining provisions shall remain enforceable to the
                            fullest extent permitted by law and these Terms of Use will be construed in all respects as
                            if such invalid or unenforceable provision will be replaced with a valid and enforceable
                            provision as similar as possible to the one replaced.
                          </p>
                          <p>
                            Entire Agreement
                            <br /> The Terms of Use, and any documents which we may incorporate herein by reference from
                            time to time, constitute the sole and entire agreement between you and ICON Foundation
                            regarding the Services and supersede all prior and contemporaneous understandings,
                            agreements, representations, and warranties, both written and oral, regarding the Services.
                          </p>
                          <p>
                            Your Comments and Questions
                            <br /> All feedback, comments, requests for technical support, and other communications
                            relating to the Services should be directed to: hello@sodax.com
                            <br />
                            <br />
                            <br />
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
