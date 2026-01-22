import Image from 'next/image';
import { ArrowDown } from 'lucide-react';
import type { ChainType } from '@sodax/types';
import { getChainIconByName } from '@/constants/chains';
import { EVM_CHAIN_ICONS } from '@/constants/chains';

const HANA_CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/hana-wallet/jfdlamikmbghhapbgfoogdffldioobgl';

const CHAIN_DISPLAY_NAMES: Record<ChainType, string> = {
  EVM: 'EVM',
  ICON: 'ICON',
  SOLANA: 'Solana',
  SUI: 'Sui',
  STELLAR: 'Stellar',
  INJECTIVE: 'Injective',
};

type GetHanaForChainProps = {
  chainType: ChainType;
};

export function GetHanaForChain({ chainType }: GetHanaForChainProps): React.ReactElement {
  const chainName = CHAIN_DISPLAY_NAMES[chainType] || chainType;

  return (
    <a
      href={HANA_CHROME_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center py-4 cursor-pointer group flex-col gap-2"
    >
      <div className="flex w-full">
        {chainType === 'EVM' && (
          <div className="text-espresso text-(length:--body-comfortable) font-['InterRegular'] leading-tight">
            Get Hana for {chainName} now
          </div>
        )}
      </div>
      <div className="flex w-full">
        {chainType === 'EVM' ? (
          <>
            {EVM_CHAIN_ICONS.map(icon => (
              <Image
                key={icon}
                src={icon}
                alt={icon}
                width={24}
                height={24}
                className="rounded-md outline outline-4 outline-white shadow-[0_6px_12px_0_rgba(185,172,171,0.1)] "
              />
            ))}
          </>
        ) : (
          <div className="w-6 relative rounded-md shadow-[-4px_0px_4px_0px_rgba(175,145,145,0.02)] outline outline-4 outline-white inline-flex flex-col justify-start items-start overflow-hidden">
            <Image
              src={getChainIconByName(chainName) || ''}
              alt={chainName}
              width={24}
              height={24}
              className="rounded-md outline outline-4 outline-white shadow-[0_6px_12px_0_rgba(185,172,171,0.1)]"
            />
            <div className="w-6 h-6 left-0 top-0 absolute bg-[radial-gradient(ellipse_50.00%_50.00%_at_50.00%_50.00%,_rgba(237,_230,_230,_0.40)_0%,_rgba(237.22,_230.40,_230.40,_0.60)_100%)]" />
          </div>
        )}

        <Image
          src="/hana.png"
          alt="Hana Wallet"
          width={24}
          height={24}
          className="rounded-md outline outline-4 outline-white shadow-[-4px_0px_4px_rgba(175,145,145)] z-2"
        />

        <div className="flex-1 ml-4">
          {chainType !== 'EVM' && (
            <div className="text-espresso text-(length:--body-comfortable) font-['InterRegular'] leading-tight">
              Get Hana for {chainName} now
            </div>
          )}
        </div>
        <div
          data-property-1="Download Hana default"
          className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-pink-400 rounded-[80px] inline-flex justify-center items-center"
        >
          <ArrowDown className="w-3 h-3 text-white" />
        </div>
      </div>
    </a>
  );
}
