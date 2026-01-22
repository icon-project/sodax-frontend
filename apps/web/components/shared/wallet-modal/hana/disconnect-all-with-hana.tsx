import Image from 'next/image';
import { Loader2Icon, MinusIcon } from 'lucide-react';

type DisconnectAllWithHanaProps = {
  onClick: () => void;
  isPending: boolean;
};

export function DisconnectAllWithHana({ onClick, isPending }: DisconnectAllWithHanaProps): React.ReactElement {
  return (
    <div
      data-property-1="Installed"
      className="-mx-4 h-12 relative bg-[#F4ECF7] rounded-2xl overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      <Image
        className="absolute -top-1 -left-[18px] [transform-style:preserve-3d] [transform:rotateY(180deg)]"
        src="/marsh.png"
        alt="Marsh"
        width={85}
        height={74}
      />
      <div className="left-[78px] top-[14px] absolute justify-center text-[#8B7493] text-(length:--body-comfortable) font-['InterRegular'] leading-5">
        Disconnect all with Hana
      </div>
      <div
        data-property-1="Download Hana default"
        className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-pink-400 rounded-[80px] inline-flex justify-center items-center absolute right-4 top-3"
      >
        {isPending ? (
          <Loader2Icon className="w-3 h-3 text-white animate-spin" />
        ) : (
          <MinusIcon className="w-3 h-3 text-white" />
        )}
      </div>
    </div>
  );
}
