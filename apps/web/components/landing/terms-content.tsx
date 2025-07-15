// apps/web/components/landing/terms-content.tsx
// Component to render terms and conditions content

import type React from 'react';
import { termsContent } from '@/lib/terms-content';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
export const TermsContent = (): React.ReactElement => {
  return (
    <ScrollArea className="h-[200px] w-full rounded-none p-0 pr-6">
      {termsContent.map((section, index) => (
        <div key={index}>
          {section.title && <p className="font-bold mb-2 text-xs text-clay">{section.title}</p>}
          <p className="text-xs text-clay">{section.content}</p>
        </div>
      ))}
      <ScrollBar className='w-1'/>
    </ScrollArea>
  );
};
