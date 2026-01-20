import Image from 'next/image';

const HANA_CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/hana-wallet/jfdlamikmbghhapbgfoogdffldioobgl';

export function InstallHanaBanner(): React.ReactElement {
  return (
    <a
      data-property-1="Not installed"
      className="self-stretch h-22 relative rounded-2xl overflow-hidden bg-[#F4ECF7] block"
      href={HANA_CHROME_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Image className="left-[282px] top-[-2px] absolute" src="/marsh.png" alt="Marsh" width={144} height={128} />
      <div
        className="left-[16px] top-[17px] absolute justify-start bg-[linear-gradient(90deg,#6256E9_40.87%,#D772D3_100%)]
  bg-clip-text
  text-transparent text-xs font-bold font-['InterRegular'] leading-4"
      >
        Get Hana Wallet. Unlock all networks.
      </div>
      <Image
        className="left-[16px] top-[38px] absolute mix-blend-multiply"
        src="/chromestore.png"
        alt="Hana Chrome Store"
        width={148}
        height={34}
      />
    </a>
  );
}
