// apps/web/app/(apps)/stake/_components/unstake-requests.tsx

import type React from 'react';
import { UnstakeRequestItem } from './unstake-request-item';
import { Separator } from '@/components/ui/separator';
import { Fragment } from 'react';

export function UnstakeRequests(): React.JSX.Element {
  const requests = [1, 2];
  return (
    <div className="w-full relative flex flex-col justify-start items-start gap-(--layout-space-normal)">
      <div className="justify-center text-espresso text-(length:--body-super-comfortable) font-bold font-['Inter'] leading-5">
        Unstake Requests
      </div>
      <div className="w-full flex flex-col justify-start items-start gap-(--layout-space-normal)">
        {requests.map((item, index) => (
          <Fragment key={item}>
            <UnstakeRequestItem />
            {index !== requests.length - 1 && <Separator className="w-full h-0.5" />}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
