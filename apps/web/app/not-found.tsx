'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Footer from '@/components/landing/footer';
import { MarketingHeader } from '@/components/shared/marketing-header';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen w-full flex-col pt-[100px]">
      <MarketingHeader />
      <div className="flex flex-1 py-32 flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center gap-6 text-center">
          {/* 404 Number */}
          <div className="relative">
            <h1 className="font-[InterBlack] text-[120px] leading-none text-primary/10 sm:text-[160px] md:text-[200px]">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-3">
            <h2 className="font-[InterBold] text-2xl text-foreground sm:text-3xl">Page Not Found</h2>
            <p className="font-[InterRegular] max-w-md text-base text-muted-foreground sm:text-lg">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Button asChild variant="default" size="lg">
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
