// BD personal note + signature shown at top of roadmap when composer sets a note.

'use client';

export interface PersonalIntroCardProps {
  note: string;
  fromName: string;
  fromSuffix: string;
}

export function PersonalIntroCard({ note, fromName, fromSuffix }: PersonalIntroCardProps): React.JSX.Element | null {
  if (!note.trim()) return null;
  const signature = [fromName.trim(), fromSuffix.trim()].filter(Boolean).join(' ');
  return (
    <div className="bg-yellow-soda/10 border border-yellow-soda/40 rounded-3xl p-6 md:p-8 flex flex-col gap-3">
      <p className="font-normal text-[15px] leading-[1.7] text-espresso whitespace-pre-line">&ldquo;{note}&rdquo;</p>
      {signature && <p className="font-medium text-[13px] text-cherry-dark">&mdash; {signature}</p>}
    </div>
  );
}
