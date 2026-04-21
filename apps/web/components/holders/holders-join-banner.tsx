import type { ReactElement } from 'react';

import Image from 'next/image';
import { DISCORD_ROUTE, X_ROUTE } from '@/constants/routes';

const COMMUNITY_LINKS = [
  { label: 'Follow on X', href: X_ROUTE },
  { label: 'Join the Discord', href: DISCORD_ROUTE },
] as const;

const LINK_CLASSNAME =
  "border-4 border-cherry-bright hover:border-cherry-brighter h-10 px-6 flex items-center justify-center font-['InterRegular'] rounded-full text-sm cursor-pointer text-white transition-all hover:scale-[102%]";

export default function HoldersJoinBanner(): ReactElement {
  return (
    <div className="h-[440px] sm:h-[480px] md:h-[560px] flex flex-col items-center bg-cherry-soda mt-4 pt-14 md:pt-18 relative overflow-hidden isolate">
      <Image
        className="mix-blend-screen absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[880px] max-w-none pointer-events-none"
        src="/soda-burn-banner.png"
        alt=""
        width={880}
        height={880}
      />
      <div className="flex flex-col items-center gap-6 z-10">
        <div className="flex flex-col items-center gap-2">
          <div className="text-(length:--main-title) font-['InterBlack'] text-yellow-soda leading-[1.1] text-center">
            Join the movement.
          </div>
          <div className="text-(length:--subtitle) font-['InterRegular'] text-cream leading-[1.2] text-center">
            The SODA holders community is growing. You can too.
          </div>
        </div>
        <div className="flex gap-4">
          {COMMUNITY_LINKS.map(({ label, href }) => (
            <a key={href} href={href} target="_blank" rel="noopener noreferrer" className={LINK_CLASSNAME}>
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
