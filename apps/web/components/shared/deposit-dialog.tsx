import type React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  SavingsIcon,
  LoansIcon,
  MigrateIcon,
  DepositDialogArrowIcon,
  DepositDialogArrowMobileIcon,
} from '@/components/icons';
import { useState, useEffect, useRef } from 'react';

interface DepositDialogProps {
  className?: string;
}

const DepositDialog: React.FC<DepositDialogProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState('portfolio');
  const [arrowPosition, setArrowPosition] = useState(110);
  const [mobileArrowPosition, setMobileArrowPosition] = useState(0);
  // const { isRegistering, notification, mounted, handleWalletClick, isConnected, address } = useWallet();

  const desktopTabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const mobileTabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const mobileTabsContainerRef = useRef<HTMLDivElement>(null);

  // Update arrow position when active tab changes
  useEffect(() => {
    const updateArrowPosition = (): void => {
      const desktopActiveTabElement = desktopTabRefs.current[activeTab];
      const mobileActiveTabElement = mobileTabRefs.current[activeTab];
      const containerElement = tabsContainerRef.current;
      const mobileContainerElement = mobileTabsContainerRef.current;

      // Update desktop arrow position
      if (desktopActiveTabElement && containerElement) {
        const containerRect = containerElement.getBoundingClientRect();
        const tabRect = desktopActiveTabElement.getBoundingClientRect();
        const relativeTop = tabRect.top - containerRect.top;
        setArrowPosition(relativeTop - 15); // 40px offset to center the arrow on the tab
      }

      // Update mobile arrow position
      if (mobileActiveTabElement && mobileContainerElement) {
        const mobileContainerRect = mobileContainerElement.getBoundingClientRect();
        const tabRect = mobileActiveTabElement.getBoundingClientRect();
        const relativeLeft = tabRect.left - mobileContainerRect.left;
        const tabWidth = tabRect.width;
        setMobileArrowPosition(relativeLeft + tabWidth / 2 - 50); // Center the arrow on the tab
      }
    };

    // Update position after a short delay to ensure DOM is updated
    const timeoutId = setTimeout(updateArrowPosition, 100);
    return () => clearTimeout(timeoutId);
  }, [activeTab]);

  // Update arrow position when window is resized
  useEffect(() => {
    const handleResize = (): void => {
      const desktopActiveTabElement = desktopTabRefs.current[activeTab];
      const mobileActiveTabElement = mobileTabRefs.current[activeTab];
      const containerElement = tabsContainerRef.current;
      const mobileContainerElement = mobileTabsContainerRef.current;

      // Update desktop arrow position
      if (desktopActiveTabElement && containerElement) {
        const containerRect = containerElement.getBoundingClientRect();
        const tabRect = desktopActiveTabElement.getBoundingClientRect();
        const relativeTop = tabRect.top - containerRect.top;
        setArrowPosition(relativeTop - 15);
      }

      // Update mobile arrow position
      if (mobileActiveTabElement && mobileContainerElement) {
        const mobileContainerRect = mobileContainerElement.getBoundingClientRect();
        const tabRect = mobileActiveTabElement.getBoundingClientRect();
        const relativeLeft = tabRect.left - mobileContainerRect.left;
        const tabWidth = tabRect.width;
        setMobileArrowPosition(relativeLeft + tabWidth / 2 - 50);
      }
    };

    // Add resize event listener
    window.addEventListener('resize', handleResize);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [activeTab]);

  const handleTabChange = (value: string): void => {
    setActiveTab(value);
  };

  const setDesktopTabRef =
    (value: string) =>
    (el: HTMLButtonElement | null): void => {
      desktopTabRefs.current[value] = el;
    };

  const setMobileTabRef =
    (value: string) =>
    (el: HTMLButtonElement | null): void => {
      mobileTabRefs.current[value] = el;
    };

  return (
    <div className="w-full max-w-[100vw] md:w-[full] md:max-w-[100vw] lg:w-[1024px] lg:max-w-[1024px] bg-transparent p-0 shadow-none border-0 data-[state=open]:animate-none z-50 absolute left-[50%] translate-x-[-50%] top-[96px] md:top-[104px]  h-[calc(100vh-96px)] md:h-[calc(100vh-104px)]">
      <Tabs value={activeTab} onValueChange={handleTabChange} orientation="vertical" className="w-full">
        <div className="flex justify-center items-start h-[calc(100vh-192px)] md:h-[calc(100vh-224px)]">
          {/* Desktop sidebar */}
          <div className="hidden md:flex md:w-[264px] lg:w-[304px] flex flex-col justify-center items-start py-4">
            <div
              ref={tabsContainerRef}
              className="md:w-[264px] lg:w-[304px] p-[120px_56px] flex flex-col items-start gap-[8px] rounded-lg bg-[linear-gradient(180deg,_#DCBAB5_0%,_#EAD6D3_14.42%,_#F4ECEA_43.27%,_#F5F1EE_100%)] h-[calc(100vh-256px)]"
            >
              <TabsList data-orientation="vertical" className="grid min-w-25 gap-y-8 shrink-0 bg-transparent">
                <TabsTrigger
                  ref={setDesktopTabRef('portfolio')}
                  value="portfolio"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <div className="inline-flex items-center gap-4 w-25">
                    <div data-property-1="Portfolio" className="w-4 h-4 relative mix-blend-multiply">
                      <div
                        className={`w-3.5 h-0.5 left-[0.67px] top-[13.33px] absolute ${activeTab === 'portfolio' ? 'bg-espresso' : 'bg-clay-light'}`}
                      />
                      <div
                        className={`w-1.5 h-[2.67px] left-[0.67px] top-[11.33px] absolute origin-top-left -rotate-90 ${activeTab === 'portfolio' ? 'bg-espresso' : 'bg-clay-light'}`}
                      />
                      <div
                        className={`w-2 h-[2.67px] left-[4.67px] top-[11.33px] absolute origin-top-left -rotate-90 ${activeTab === 'portfolio' ? 'bg-espresso' : 'bg-clay-light'}`}
                      />
                      <div
                        className={`w-[3.33px] h-[2.67px] left-[8.67px] top-[11.33px] absolute origin-top-left -rotate-90 ${activeTab === 'portfolio' ? 'bg-espresso' : 'bg-clay-light'}`}
                      />
                      <div
                        className={`w-2.5 h-[2.67px] left-[12.67px] top-[11.33px] absolute origin-top-left -rotate-90 ${activeTab === 'portfolio' ? 'bg-espresso' : 'bg-clay-light'}`}
                      />
                    </div>
                    <div className="flex justify-start items-center gap-1">
                      <div
                        className={`mix-blend-multiply justify-end text-base font-normal leading-snug ${activeTab === 'portfolio' ? "text-espresso font-['Shrikhand']" : "text-clay font-['InterRegular']"}`}
                      >
                        Portfolio
                      </div>
                    </div>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  ref={setDesktopTabRef('savings')}
                  value="savings"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <div className="inline-flex items-center gap-4 w-25">
                    <div data-property-1="Savings" className="w-4 h-4 relative mix-blend-multiply">
                      <SavingsIcon fill={activeTab === 'savings' ? '#483534' : '#B9ACAB'} />
                    </div>
                    <div className="flex justify-start items-center gap-2">
                      <div
                        className={`mix-blend-multiply justify-end text-base font-normal leading-snug ${activeTab === 'savings' ? "text-espresso font-['Shrikhand']" : "text-clay font-['InterRegular']"}`}
                      >
                        savings
                      </div>
                    </div>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  ref={setDesktopTabRef('loans')}
                  value="loans"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <div className="inline-flex items-center gap-4 w-25">
                    <div data-property-1="Loan" className="w-4 h-4 relative mix-blend-multiply">
                      <LoansIcon fill={activeTab === 'loans' ? '#483534' : '#B9ACAB'} />
                    </div>
                    <div className="flex justify-start items-center gap-1">
                      <div
                        className={`mix-blend-multiply justify-end text-base font-normal leading-snug ${activeTab === 'loans' ? "text-espresso font-['Shrikhand']" : "text-clay font-['InterRegular']"}`}
                      >
                        Loans
                      </div>
                    </div>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  ref={setDesktopTabRef('migrate')}
                  value="migrate"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <div className="inline-flex items-center gap-4 w-25">
                    <div data-property-1="Migrate" className="w-4 h-4 relative mix-blend-multiply">
                      <MigrateIcon fill={activeTab === 'migrate' ? '#483534' : '#B9ACAB'} />
                    </div>
                    <div className="flex justify-start items-center gap-1">
                      <div
                        className={`mix-blend-multiply justify-end text-base font-normal leading-snug ${activeTab === 'migrate' ? "text-espresso font-['Shrikhand']" : "text-clay font-['InterRegular']"}`}
                      >
                        Migrate
                      </div>
                    </div>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div className="w-full md:w-[calc(100%-200px)] lg:w-[784px] h-[calc(100vh-192px)] md:h-[calc(100vh-224px)] p-[120px_80px] flex items-start gap-[8px] rounded-lg border-[8px] border-vibrant-white bg-[radial-gradient(239.64%_141.42%_at_0%_0%,_#E3D8D8_0%,_#F5F2F2_22.12%,_#F5F2F2_57.69%,_#F5EDED_100%)] to-transparent relative md:-ml-16 border-b-0 md:border-b-8">
            <DepositDialogArrowIcon
              className="absolute hidden md:block transition-all duration-300 ease-in-out"
              style={{ top: `${arrowPosition}px`, left: '-23px' }}
            />
            <DepositDialogArrowMobileIcon
              className="absolute transition-all duration-300 ease-in-out md:hidden"
              style={{ bottom: '-1px', left: `${mobileArrowPosition}px` }}
              fill="#CC9E9A"
            />
            <TabsContent value="portfolio">
              <div className="mix-blend-multiply justify-end">
                <span className="text-yellow-dark text-3xl font-bold font-['InterRegular'] leading-9">
                  Savings app with
                  <br />
                </span>
                <span className="text-yellow-dark text-3xl font-normal font-['Shrikhand'] leading-9">
                  a quick portfolio
                </span>
              </div>
            </TabsContent>
            <TabsContent value="savings">
              <div className="mix-blend-multiply justify-end">
                <span className="text-yellow-dark text-3xl font-bold font-['InterRegular'] leading-9">
                  Savings app with
                  <br />
                </span>
                <span className="text-yellow-dark text-3xl font-normal font-['Shrikhand'] leading-9">
                  a quick savings
                </span>
              </div>
            </TabsContent>
            <TabsContent value="loans">
              <div className="mix-blend-multiply justify-end">
                <span className="text-yellow-dark text-3xl font-bold font-['InterRegular'] leading-9">
                  Savings app with
                  <br />
                </span>
                <span className="text-yellow-dark text-3xl font-normal font-['Shrikhand'] leading-9">
                  a quick loans
                </span>
              </div>
            </TabsContent>
            <TabsContent value="migrate">
              <div className="mix-blend-multiply justify-end">
                <span className="text-yellow-dark text-3xl font-bold font-['InterRegular'] leading-9">
                  Savings app with
                  <br />
                </span>
                <span className="text-yellow-dark text-3xl font-normal font-['Shrikhand'] leading-9">
                  a quick migrate
                </span>
              </div>
            </TabsContent>
          </div>

          {/* Mobile bottom tabs */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-[96px] ">
            <div className="relative">
              <div
                ref={mobileTabsContainerRef}
                className="w-full px-4 py-4 bg-cherry-bright h-[96px] flex align-center"
              >
                <TabsList data-orientation="horizontal" className="grid grid-cols-4 gap-4 bg-transparent h-20">
                  <TabsTrigger
                    ref={setMobileTabRef('portfolio')}
                    value="portfolio"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <div className="flex flex-col items-center gap-2 w-[25vw]">
                      <div data-property-1="Portfolio" className="w-4 h-4 relative ">
                        <div
                          className={`w-3.5 h-0.5 left-[0.67px] top-[13.33px] absolute ${activeTab === 'portfolio' ? 'bg-yellow-soda' : 'bg-white'}`}
                        />
                        <div
                          className={`w-1.5 h-[2.67px] left-[0.67px] top-[11.33px] absolute origin-top-left -rotate-90 ${activeTab === 'portfolio' ? 'bg-yellow-soda' : 'bg-white'}`}
                        />
                        <div
                          className={`w-2 h-[2.67px] left-[4.67px] top-[11.33px] absolute origin-top-left -rotate-90 ${activeTab === 'portfolio' ? 'bg-yellow-soda' : 'bg-white'}`}
                        />
                        <div
                          className={`w-[3.33px] h-[2.67px] left-[8.67px] top-[11.33px] absolute origin-top-left -rotate-90 ${activeTab === 'portfolio' ? 'bg-yellow-soda' : 'bg-white'}`}
                        />
                        <div
                          className={`w-2.5 h-[2.67px] left-[12.67px] top-[11.33px] absolute origin-top-left -rotate-90 ${activeTab === 'portfolio' ? 'bg-yellow-soda' : 'bg-white'}`}
                        />
                      </div>
                      <div
                        className={`text-xs font-normal leading-snug ${activeTab === 'portfolio' ? "text-yellow-soda font-['Shrikhand']" : "text-white font-['InterRegular']"}`}
                      >
                        Portfolio
                      </div>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    ref={setMobileTabRef('savings')}
                    value="savings"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <div className="flex flex-col items-center gap-2  w-[25vw]">
                      <div data-property-1="Savings" className="w-4 h-4 relative ">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          aria-label="Savings"
                        >
                          <title>Savings</title>
                          <g>
                            <path
                              d="M15.3333 5.76276L9.22082 9.39145L7.99177 10.1172L0.666626 5.76276L1.89568 3.56867L5.55005 5.74588C5.66476 5.81339 5.79586 5.86403 5.94335 5.86403C6.40219 5.86403 6.76272 5.49272 6.76272 5.02014V0.665711H9.22082V5.02014C9.22082 5.49272 9.58134 5.86403 10.0402 5.86403C10.1877 5.86403 10.3188 5.81339 10.4335 5.74588L14.1042 3.58555L15.3333 5.76276Z"
                              fill={activeTab === 'savings' ? '#ffd92f' : '#fff'}
                            />
                            <rect
                              x="0.666626"
                              y="12.666"
                              width="14.6667"
                              height="2.66667"
                              fill={activeTab === 'savings' ? '#ffd92f' : '#fff'}
                            />
                          </g>
                        </svg>
                      </div>
                      <div
                        className={`text-xs font-normal leading-snug ${activeTab === 'savings' ? "text-yellow-soda font-['Shrikhand']" : "text-white font-['InterRegular']"}`}
                      >
                        savings
                      </div>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    ref={setMobileTabRef('loans')}
                    value="loans"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <div className="flex flex-col items-center gap-2  w-[25vw]">
                      <div data-property-1="Loan" className="w-4 h-4 relative ">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          aria-label="Loan"
                        >
                          <title>Loan</title>
                          <g>
                            <path
                              d="M15.3333 5.02044L9.22082 1.39175L7.99177 0.666016L0.666626 5.02044L1.89568 7.21454L5.55005 5.03732C5.66476 4.96981 5.79586 4.91918 5.94335 4.91918C6.40219 4.91918 6.76272 5.29048 6.76272 5.76306V10.1175H9.22082V5.76306C9.22082 5.29048 9.58134 4.91918 10.0402 4.91918C10.1877 4.91918 10.3188 4.96981 10.4335 5.03732L14.1042 7.19766L15.3333 5.02044Z"
                              fill={activeTab === 'loans' ? '#ffd92f' : '#fff'}
                            />
                            <rect
                              x="0.666626"
                              y="12.666"
                              width="14.6667"
                              height="2.66667"
                              fill={activeTab === 'loans' ? '#ffd92f' : '#fff'}
                            />
                          </g>
                        </svg>
                      </div>
                      <div
                        className={`text-xs font-normal leading-snug ${activeTab === 'loans' ? "text-yellow-soda font-['Shrikhand']" : "text-white font-['InterRegular']"}`}
                      >
                        Loans
                      </div>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    ref={setMobileTabRef('migrate')}
                    value="migrate"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <div className="flex flex-col items-center gap-2  w-[25vw]">
                      <div data-property-1="Migrate" className="w-4 h-4 relative ">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          aria-label="Migrate"
                        >
                          <title>Migrate</title>
                          <g>
                            <path
                              d="M10.9199 0.667318L14.5486 6.77979L15.2743 8.00884L10.9199 15.334L8.72577 14.1049C9.70829 12.4558 12.4895 8.00884 12.4895 8.00884C12.4895 8.00884 9.71318 3.54545 8.74265 1.89637L10.9199 0.667318Z"
                              fill={activeTab === 'migrate' ? '#ffd92f' : '#fff'}
                            />
                            <path
                              d="M2.97895 0.667318L6.60764 6.77979L7.33337 8.00884L2.97895 15.334L0.784853 14.1049C1.76737 12.4558 4.54854 8.00884 4.54854 8.00884C4.54854 8.00884 1.77226 3.54545 0.801731 1.89637L2.97895 0.667318Z"
                              fill={activeTab === 'migrate' ? '#ffd92f' : '#fff'}
                            />
                          </g>
                        </svg>
                      </div>
                      <div
                        className={`text-xs font-normal leading-snug ${activeTab === 'migrate' ? "text-yellow-soda font-['Shrikhand']" : "text-white font-['InterRegular']"}`}
                      >
                        Migrate
                      </div>
                    </div>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default DepositDialog;
