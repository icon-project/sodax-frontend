'use client';

import Link from 'next/link';
import * as React from 'react';

import { usePathname } from 'next/navigation';

export function NavigationMenuDemo() {
  const pathname = usePathname();

  return (
    <div className="flex items-center">
      <ExampleLink href="/" name="Dashboard" isActive={pathname === '/'} />
      <ExampleLink href="/markets" name="Markets" isActive={pathname === '/markets'} />
    </div>
  );
}

function ExampleLink({
  href,
  isActive,
  name,
}: {
  href: string;
  isActive: boolean;
  name: string;
}) {
  return (
    <Link
      href={href}
      key={href}
      className="flex h-7 items-center justify-center rounded-full px-4 text-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary data-[active=true]:bg-muted data-[active=true]:text-primary"
      data-active={isActive}
    >
      {name}
    </Link>
  );
}
