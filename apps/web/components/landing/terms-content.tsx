// apps/web/components/landing/terms-content.tsx
// Component to render terms and conditions content

import type React from 'react';
import { termsContent } from '@/lib/terms-content';

export const TermsContent = (): React.ReactElement => {
  return (
    <div className="space-y-4 text-xs leading-relaxed text-clay mr-6">
      {termsContent.map((section, index) => (
        <div key={index}>
          {section.title && <p className="font-bold mb-2">{section.title}</p>}
          <p>{section.content}</p>
        </div>
      ))}
    </div>
  );
};
