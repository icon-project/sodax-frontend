import Image from 'next/image';

export function AllNetworkIcon(): React.JSX.Element {
  return (
    <div className="w-6 h-6 grid grid-cols-2 gap-1 p-[2px]">
      <Image src="/chain/0x2105.base.png" alt="Base" width={8} height={8} className="rounded-[2px]" priority />
      <Image src="/chain/solana.png" alt="Solana" width={8} height={8} className="rounded-[2px]" priority />
      <Image src="/chain/0xa4b1.arbitrum.png" alt="Arbitrum" width={8} height={8} className="rounded-[2px]" priority />
      <Image src="/chain/sui.png" alt="Sui" width={8} height={8} className="rounded-[2px]" priority />
    </div>
  );
}
