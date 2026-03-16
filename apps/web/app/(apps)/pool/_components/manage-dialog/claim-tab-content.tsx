import type React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';

type ClaimTabContentProps = {
  hasUnclaimedFees: boolean;
  isPending: boolean;
  isClaimPending: boolean;
  onClaimFees: () => void;
};

export function ClaimTabContent({
  hasUnclaimedFees,
  isPending,
  isClaimPending,
  onClaimFees,
}: ClaimTabContentProps): React.JSX.Element {
  return (
    <TabsContent value="claim" className="space-y-3">
      <div className="self-stretch flex justify-between items-start">
        <div className="flex justify-start items-center gap-3">
          <div data-property-1="Pair" className="inline-flex flex-col justify-start items-center gap-2">
            <div className="inline-flex justify-start items-center">
              <div className="w-12 h-12 relative">
                <div className="w-12 h-12 left-0 top-0 absolute bg-gradient-to-br from-white to-zinc-100 rounded-[80px] shadow-[0px_8px_20px_0px_rgba(175,145,145,0.20)]" />
                <div className="h-6 left-[12px] top-[12px] absolute bg-white rounded-[256px] inline-flex flex-col justify-center items-center overflow-hidden">
                  <img data-property-1="SODA" className="w-6 h-6 rounded-[256px]" src="https://placehold.co/24x24" />
                </div>
              </div>
              <div className="w-12 h-12 relative">
                <div className="w-12 h-12 left-0 top-0 absolute bg-gradient-to-br from-white to-zinc-100 rounded-[80px] shadow-[0px_8px_20px_0px_rgba(175,145,145,0.20)]" />
                <div className="h-6 left-[12px] top-[12px] absolute bg-white rounded-[256px] inline-flex flex-col justify-center items-center overflow-hidden">
                  <img data-property-1="xSODA" className="w-6 h-6 rounded-[256px]" src="https://placehold.co/24x24" />
                </div>
                <div className="h-4 left-[30px] top-[30px] absolute bg-white rounded shadow-[-2px_0px_2px_0px_rgba(175,145,145,0.10)] outline outline-2 outline-white inline-flex flex-col justify-center items-center overflow-hidden">
                  <img data-property-1="Solana" className="w-4 h-4" src="https://placehold.co/16x16" />
                </div>
              </div>
            </div>
          </div>
          <div className="inline-flex flex-col justify-center items-start gap-0.5">
            <div className="inline-flex justify-start items-center gap-2">
              <div className="justify-center text-espresso text-base font-normal font-['Inter'] leading-5">SODA / xSODA</div>
            </div>
            <div className="inline-flex justify-start items-center gap-1">
              <div className="justify-center text-espresso text-xs font-bold font-['Inter'] leading-4">10,002.71</div>
              <div className="justify-center text-clay text-xs font-normal font-['Inter'] leading-4">/</div>
              <div className="justify-center text-espresso text-xs font-bold font-['Inter'] leading-4">6,981.48</div>
            </div>
          </div>
        </div>
        <div className="h-12 px-2 bg-blend-multiply bg-almost-white rounded-lg flex flex-col justify-center items-end">
          <div className="text-center justify-start text-clay text-[9px] font-medium font-['Inter'] uppercase leading-3"> current APR</div>
          <div className="text-center justify-start text-espresso text-base font-bold font-['Inter'] leading-5">8.49%</div>
        </div>
      </div>
      <div className="self-stretch inline-flex flex-col justify-start items-start">
        <div className="pl-8 opacity-80 flex flex-col justify-start items-start gap-2">
          <div className="w-4 h-20 relative origin-top-left rotate-90">
            <div className="w-4 h-20 left-[80px] top-0 absolute origin-top-left rotate-90 bg-blend-multiply bg-Almost-white" />
          </div>
        </div>
        <div className="self-stretch px-8 py-6 bg-blend-multiply bg-Almost-white rounded-2xl flex flex-col justify-start items-start gap-4">
          <div className="inline-flex justify-start items-center gap-6">
            <div className="text-right justify-start text-clay text-[9px] font-medium font-['Inter'] uppercase leading-3">your      fees</div>
            <div className="flex justify-start items-center gap-3">
              <div className="w-0 h-10 outline outline-2 outline-offset-[-1px] outline-cherry-grey" />
              <div className="inline-flex flex-col justify-start items-start">
                <div className="inline-flex justify-center items-center gap-2">
                  <div className="bg-white rounded-[384px] shadow-[-4.5px_0px_6px_0px_rgba(175,145,145,0.20)] outline outline-[3px] outline-white inline-flex flex-col justify-center items-center overflow-hidden">
                    <img data-property-1="SODA" className="w-3 h-3 rounded-[384px]" src="https://placehold.co/12x12" />
                  </div>
                  <div className="justify-start text-espresso text-base font-bold font-['Inter'] leading-5">0.0021</div>
                </div>
                <div className="justify-start text-clay text-xs font-normal font-['Inter'] leading-4">$0.0005</div>
              </div>
            </div>
            <div className="flex justify-start items-center gap-3">
              <div className="w-0 h-10 outline outline-2 outline-offset-[-1px] outline-cherry-grey" />
              <div className="inline-flex flex-col justify-start items-start">
                <div className="inline-flex justify-center items-center gap-2">
                  <div data-property-1="Default" className="bg-white rounded-[384px] shadow-[-4.5px_0px_6px_0px_rgba(175,145,145,0.20)] outline outline-[3px] outline-white inline-flex flex-col justify-center items-center overflow-hidden">
                    <img data-property-1="xSODA" className="w-3 h-3 rounded-[384px]" src="https://placehold.co/12x12" />
                  </div>
                  <div className="justify-start text-espresso text-base font-bold font-['Inter'] leading-5">0.0038</div>
                </div>
                <div className="justify-start text-clay text-xs font-normal font-['Inter'] leading-4">$0.0003</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Button variant="cherry" className="w-full" onClick={onClaimFees} disabled={isPending || !hasUnclaimedFees}>
        {isClaimPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        {hasUnclaimedFees ? 'Claim Fee' : 'No Fee to Claim'}
      </Button>
    </TabsContent>
  );
}
