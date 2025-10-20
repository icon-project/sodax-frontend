import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const MigrateSection = () => {
  const router = useRouter();

  return (
    <div className="h-[440px] sm:h-[480px] md:h-[560px] flex flex-col items-center bg-almost-white mt-4 pt-14 md:pt-18 relative overflow-hidden section2">
      <Image
        className="mix-blend-multiply absolute -bottom-30 md:bottom-0 left-1/2 transform -translate-x-1/2 w-202 z-0 max-w-202"
        src="/test.png"
        alt="background"
        width={810}
        height={538}
      />
      <div className="flex items-center gap-4">
        <Image src="/symbol_dark.png" alt="SODAX Symbol" width={32} height={32} className="md:w-8 md:h-8 w-6 h-6" />
        <div className="text-(length:--main-title) font-['InterBlack'] text-black leading-[1.1]">
          Test SODA migration
        </div>
      </div>
      <Label className="text-(length:--subtitle) font-[InterRegular] text-black mt-2 leading-[1.2]">
        Swap 1:1 between ICX and SODA.
      </Label>
      <div className="mt-6 z-10">
        <Button
          variant="outline"
          className="px-6 font-['InterMedium'] cursor-pointer"
          size="lg"
          onClick={() => router.push('/migrate')}
        >
          Migrate
        </Button>
      </div>
    </div>
  );
};

export default MigrateSection;
