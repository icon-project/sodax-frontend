interface CoffeeCupIconProps {
  width?: number;
  height?: number;
  className?: string;
  stroke?: string;
}

export function CoffeeCupIcon({ width = 16, height = 16, className = '', stroke = 'currentColor' }: CoffeeCupIconProps) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
    <svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M11.333 5.33337H11.9997C12.7069 5.33337 13.3852 5.61433 13.8853 6.11442C14.3854 6.61452 14.6663 7.2928 14.6663 8.00004C14.6663 8.70728 14.3854 9.38556 13.8853 9.88566C13.3852 10.3858 12.7069 10.6667 11.9997 10.6667H11.333"
        stroke={stroke}
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 5.33337H11.3333V11.3334C11.3333 12.0406 11.0524 12.7189 10.5523 13.219C10.0522 13.7191 9.37391 14 8.66667 14H4.66667C3.95942 14 3.28115 13.7191 2.78105 13.219C2.28095 12.7189 2 12.0406 2 11.3334V5.33337Z"
        stroke={stroke}
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 1.33337V2.66671" stroke={stroke} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M6.66699 1.33337V2.66671"
        stroke={stroke}
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.33301 1.33337V2.66671"
        stroke={stroke}
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
