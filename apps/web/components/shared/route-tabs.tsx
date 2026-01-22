import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import RouteTabItem from '@/components/shared/route-tab-item';
import { ArrowRightIcon, ArrowUpIcon } from '@/components/icons';
import { useSaveStore } from '@/app/(apps)/save/_stores/save-store-provider';

import type { TabIconType } from './tab-icon';
import { cn } from '@/lib/utils';

export interface TabConfig {
  value: string;
  type: TabIconType;
  label: string;
  content: string;
  enabled: boolean;
  href?: string;
  showIcon?: boolean;
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

export const partnerTabConfigs: TabConfig[] = [
  { value: 'home', type: 'migrate', label: 'Home', content: '', enabled: true, showIcon: false },
];

interface RouteTabsProps {
  tabs?: TabConfig[];
  hrefPrefix?: string;
}

export function RouteTabs({ tabs, hrefPrefix }: RouteTabsProps = {}): React.JSX.Element {
  const pathname = usePathname();
  const isPartnerRoute = pathname.startsWith('/partner');
  const usedTabs = isPartnerRoute ? partnerTabConfigs : tabConfigs;

  const lastSegment = pathname.split('/').filter(Boolean).pop() ?? '';
  const tabValues = usedTabs.map(t => t.value);

  const current = tabValues.includes(lastSegment)
    ? lastSegment // e.g. "swap", "migrate", "home"
    : (usedTabs[0]?.value ?? 'migrate'); // fallback = first tab (Home for partner)

  const tokenCount = useSaveStore(state => state.tokenCount);

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
        className={cn(
          'hidden md:flex p-[120px_32px] lg:p-[120px_56px] flex-col items-start gap-2 rounded-tl-4xl',
          'bg-[linear-gradient(180deg,#DCBAB5_0px,#EAD6D3_120px,#F4ECEA_360px,#F5F1EE_1000px)]',
          'relative lg:mt-4 min-h-[calc(100vh-192px)] md:min-h-[calc(100vh-104px)] lg:min-h-[calc(100vh-120px)]',
          isPartnerRoute
            ? 'md:w-[320px] lg:w-65' // wider partner sidebar
            : 'md:w-66 lg:w-76', // existing apps unchanged
        )}
      >
        <div className="grid min-w-25 gap-y-8 shrink-0 bg-transparent p-0">
          {usedTabs.map(tab => {
            const href = tab.href ?? `/${tab.value}`;
            const isLink = Boolean(tab.href);
            const active =
              pathname === href ||
              pathname.startsWith(`${href}/`) || // handles subpaths like /apps/partner/stats
              pathname.endsWith(`/${tab.value}`); // old-style matching as extra safety
            return (
              <RouteTabItem
                key={tab.value}
                href={isLink ? href : undefined}
                value={tab.value}
                type={tab.type}
                label={tab.label}
                isActive={active}
                isMobile={false}
                setRef={setDesktopTabRef(tab.value)}
                enabled={tab.enabled}
                badgeCount={tab.value === 'save' ? suppliedAssetCount : undefined}
                showIcon={tab.showIcon !== false}
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
              {usedTabs.map(tab => {
                const href = tab.href ?? `/${tab.value}`;
                const isLink = Boolean(tab.href);
                const active = current === tab.value;
                return (
                  <RouteTabItem
                    key={tab.value}
                    href={isLink ? href : undefined}
                    value={tab.value}
                    type={tab.type}
                    label={tab.label}
                    isActive={active}
                    isMobile
                    setRef={setMobileTabRef(tab.value)}
                    enabled={tab.enabled}
                    badgeCount={tab.value === 'save' ? suppliedAssetCount : undefined}
                    showIcon={tab.showIcon !== false}
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
