import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import RouteTabItem from '@/components/shared/route-tab-item';
import { ArrowRightIcon, ArrowUpIcon } from '@/components/icons';
import { useSaveStore } from '@/app/(apps)/save/_stores/save-store-provider';

import type { TabIconType } from './tab-icon';

export interface TabConfig {
  value: string;
  type: TabIconType;
  label: string;
  content: string;
  enabled: boolean;
}

export const tabConfigs: TabConfig[] = [
  {
    value: 'swap',
    type: 'swap',
    label: 'Swap',
    content: 'a quick swap',
    enabled: true,
  },
  {
    value: 'save',
    type: 'save',
    label: 'Save',
    content: 'a quick save',
    enabled: true,
  },
  {
    value: 'loans',
    type: 'loans',
    label: 'Loans',
    content: 'a quick loans',
    enabled: false,
  },
  {
    value: 'migrate',
    type: 'migrate',
    label: 'Migrate',
    content: 'a quick migrate',
    enabled: true,
  },
];

export function RouteTabs(): React.JSX.Element {
  const pathname = usePathname();
  const current = pathname.split('/').pop() || 'migrate';
  const suppliedAssetCount = useSaveStore(state => state.suppliedAssetCount);

  const desktopTabRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({});
  const mobileTabRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({});
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const mobileTabsContainerRef = useRef<HTMLDivElement>(null);

  const [arrowPosition, setArrowPosition] = useState(current === 'migrate' ? 252 : 90);
  const [mobileArrowPosition, setMobileArrowPosition] = useState(current === 'migrate' ? 280 : 13);

  const setDesktopTabRef = (value: string) => (el: HTMLAnchorElement | null) => {
    desktopTabRefs.current[value] = el;
  };
  const setMobileTabRef = (value: string) => (el: HTMLAnchorElement | null) => {
    mobileTabRefs.current[value] = el;
  };

  const updateArrows = useCallback(() => {
    const container = tabsContainerRef.current;
    const activeDesktop = desktopTabRefs.current[current];

    if (container && activeDesktop) {
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeDesktop.getBoundingClientRect();
      setArrowPosition(tabRect.top - containerRect.top - 30);
    }

    const mContainer = mobileTabsContainerRef.current;
    const activeMobile = mobileTabRefs.current[current];

    if (mContainer && activeMobile) {
      const mobileRect = mContainer.getBoundingClientRect();
      const tabRect = activeMobile.getBoundingClientRect();
      setMobileArrowPosition(tabRect.left - mobileRect.left + tabRect.width / 2 - 40);
    }
  }, [current]);

  useEffect(() => {
    updateArrows();
  }, [updateArrows]);

  useEffect(() => {
    const onResize = () => {
      const container = tabsContainerRef.current;
      const activeDesktop = desktopTabRefs.current[current];

      if (container && activeDesktop) {
        const containerRect = container.getBoundingClientRect();
        const tabRect = activeDesktop.getBoundingClientRect();
        setArrowPosition(tabRect.top - containerRect.top - 30);
      }

      const mContainer = mobileTabsContainerRef.current;
      const activeMobile = mobileTabRefs.current[current];

      if (mContainer && activeMobile) {
        const mobileRect = mContainer.getBoundingClientRect();
        const tabRect = activeMobile.getBoundingClientRect();
        setMobileArrowPosition(tabRect.left - mobileRect.left + tabRect.width / 2 - 40);
      }
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [updateArrows]);

  return (
    <>
      <div
        ref={tabsContainerRef}
        className="hidden md:flex md:w-[264px] lg:w-[304px] p-[120px_32px] lg:p-[120px_56px] flex flex-col items-start gap-[8px] rounded-tl-[2rem] bg-[linear-gradient(180deg,_#DCBAB5_0px,_#EAD6D3_120px,_#F4ECEA_360px,_#F5F1EE_1000px)] relative lg:mt-4 min-h-[calc(100vh-192px)] md:min-h-[calc(100vh-104px)] lg:min-h-[calc(100vh-120px)]"
        style={{ height: '-webkit-fill-available' }}
      >
        <div className="grid min-w-25 gap-y-8 shrink-0 bg-transparent p-0">
          {tabConfigs.map(tab => {
            const active = current === tab.value;
            return (
              <RouteTabItem
                key={tab.value}
                href={`/${tab.value}`}
                value={tab.value}
                type={tab.type}
                label={tab.label}
                isActive={active}
                isMobile={false}
                setRef={setDesktopTabRef(tab.value)}
                enabled={tab.enabled}
                badgeCount={tab.value === 'save' ? suppliedAssetCount : undefined}
              />
            );
          })}
        </div>

        <ArrowRightIcon
          className="absolute hidden md:block transition-all duration-300 ease-in-out z-20"
          style={{ top: `${arrowPosition}px`, right: '63px' }}
        />
      </div>

      <div className="md:hidden fixed -bottom-24 left-0 right-0 z-50 h-24">
        <div className="relative">
          <div ref={mobileTabsContainerRef} className="w-full px-4 py-4 bg-cream-white h-24 flex">
            <div className="grid grid-cols-4 gap-4 bg-transparent py-0 w-full">
              {tabConfigs.map(tab => {
                const active = current === tab.value;
                return (
                  <RouteTabItem
                    key={tab.value}
                    href={`/${tab.value}`}
                    value={tab.value}
                    type={tab.type}
                    label={tab.label}
                    isActive={active}
                    isMobile
                    setRef={setMobileTabRef(tab.value)}
                    enabled={tab.enabled}
                    badgeCount={tab.value === 'save' ? suppliedAssetCount : undefined}
                  />
                );
              })}
            </div>
          </div>

          <ArrowUpIcon
            className="absolute transition-all duration-300 ease-in-out md:hidden"
            style={{ top: '-16px', left: `${mobileArrowPosition}px` }}
          />
        </div>
      </div>
    </>
  );
}
