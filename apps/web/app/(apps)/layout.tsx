'use client';

import type { ReactNode } from 'react';
import { Header } from '@/components/shared/header';
import { RouteTabs } from '@/components/shared/route-tabs';
import { SwapStoreProvider } from './swap/_stores/swap-store-provider';
import { MigrationStoreProvider } from './migrate/_stores/migration-store-provider';
import { SaveStoreProvider } from './save/_stores/save-store-provider';
import { WalletModal } from '@/components/shared/wallet-modal/wallet-modal';
import TermsConfirmationModal from '@/components/shared/wallet-modal/terms-confirmation-modal';
import { ModalStoreProvider } from '@/stores/modal-store-provider';
import '../globals.css';
import { useAppStore } from '@/stores/app-store-provider';
import { motion } from 'framer-motion';
import LandingPage from '../page';
import { headerVariants, contentVariants, mainContentVariants } from '@/constants/animation';
import { useRef, useState, useLayoutEffect, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export default function RootLayout({ children }: { children: ReactNode }) {
  const { isSwitchingPage } = useAppStore(state => state);
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const isMobile = useIsMobile();
  const { shouldTriggerAnimation } = useAppStore(state => state);
  const { setShouldTriggerAnimation } = useAppStore(state => state);

  useLayoutEffect(() => {
    if (ref.current) {
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const newHeight = entry.target.getBoundingClientRect().height;
          if (newHeight > 0) {
            setHeight(newHeight);
          }
        }
      });

      resizeObserver.observe(ref.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);

  useEffect(() => {
    if (shouldTriggerAnimation) {
      setShouldTriggerAnimation(false);
    }
  }, [shouldTriggerAnimation, setShouldTriggerAnimation]);

  return (
    <SwapStoreProvider>
      <MigrationStoreProvider>
        <SaveStoreProvider>
          <div className="fixed top-0 left-0 w-screen h-screen">
            <LandingPage />
          </div>
          <ModalStoreProvider>
            <div className="max-h-screen sm:max-h-none sm:min-h-screen w-[100%] overflow-hidden">
              <motion.div
                variants={headerVariants}
                initial={!shouldTriggerAnimation ? 'open' : 'closed'}
                animate={isSwitchingPage ? 'open' : 'closed'}
              >
                <Header />
              </motion.div>

              <motion.div
                variants={contentVariants}
                initial={!shouldTriggerAnimation ? 'open' : { y: '300px' }}
                animate={isSwitchingPage ? 'open' : 'closed'}
                className="bg-cream-white relative min-h-[calc(100vh-240px)] "
                style={{ height: !isMobile ? height - 136 : height - 40 }}
              >
                <div className="w-full lg:w-[1024px] lg:max-w-[1024px] absolute md:-top-34 -top-36 left-1/2 -translate-x-1/2">
                  <motion.div
                    variants={mainContentVariants}
                    initial={!shouldTriggerAnimation ? 'open' : { y: 30, opacity: 0 }}
                    animate={isSwitchingPage ? 'open' : 'closed'}
                    className="flex justify-center items-start min-h-[calc(100vh-192px)] md:min-h-[calc(100vh-224px)]"
                  >
                    <RouteTabs />
                    <div
                      ref={ref}
                      className="w-full md:w-[calc(100%-200px)] lg:w-[784px] min-h-[calc(100vh-192px)] md:min-h-[calc(100vh-104px)]
                        p-[80px_16px] pb-10 md:p-[120px_48px] lg:p-[120px_80px] flex items-start gap-2
                        rounded-tl-[32px] rounded-tr-[32px] border-8 border-vibrant-white bg-[radial-gradient(1400px_1400px_at_0%_0%,_#E3D8D8_0%,_#F5F2F2_22.12%,_#F5F2F2_57.69%,_#F5EDED_100%)] 
                        border-b-0 z-20 ml-0 md:-ml-16 max-h-[calc(100vh-192px)] sm:max-h-none overflow-auto"
                    >
                      {children}
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              <WalletModal />
              <TermsConfirmationModal />
            </div>
          </ModalStoreProvider>
        </SaveStoreProvider>
      </MigrationStoreProvider>
    </SwapStoreProvider>
  );
}
