'use client';

import { FileDown } from 'lucide-react';
import { downloadFile } from '@/lib/download-utils';

interface PdfDownloadButtonProps {
  title?: string;
  pdfUrl?: string;
}

export function PdfDownloadButton({ title = 'Case Study', pdfUrl }: PdfDownloadButtonProps) {
  const handleDownload = () => {
    if (pdfUrl) {
      downloadFile(pdfUrl, `${title}.pdf`);
    } else {
      // Fallback to print dialog
      window.print();
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-[var(--cream-white)] rounded-lg transition-colors shrink-0 w-full sm:w-auto"
      aria-label={pdfUrl ? `Download ${title} PDF` : `Print ${title} as PDF`}
      title={pdfUrl ? 'Download PDF' : 'Print or save as PDF'}
    >
      <FileDown size={16} className="text-[var(--espresso)]" />
      <span className="font-['InterMedium'] text-sm text-[var(--espresso)] sm:hidden md:inline">
        {pdfUrl ? 'Download PDF' : 'Download'}
      </span>
      <span className="font-['InterMedium'] text-sm text-[var(--espresso)] hidden sm:inline md:hidden">
        PDF
      </span>
    </button>
  );
}
