interface DecorativeDividerProps {
  className?: string;
}

export function DecorativeDivider({ className = '' }: DecorativeDividerProps) {
  return (
    <div className={`w-full flex flex-col gap-[1px] ${className}`}>
      {/* Top darker line */}
      <div className="h-[1px] bg-[#483534] opacity-[0.15]" />
      {/* Bottom lighter line */}
      <div className="h-[1px] bg-white opacity-30" />
    </div>
  );
}
