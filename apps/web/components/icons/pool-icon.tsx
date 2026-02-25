interface PoolIconProps {
  width?: number;
  height?: number;
  className?: string;
  fill?: string;
  isActive?: boolean;
  isMobile?: boolean;
}

export const PoolIcon = ({
  width = 16,
  height = 16,
  fill,
  isActive = false,
  isMobile = false,
  ...props
}: PoolIconProps): React.JSX.Element => {
  const activeColor = isMobile ? '#B9ACAB' : '#8E7E7D';
  const inactiveColor = isMobile ? '#B9ACAB' : '#EDE6E6';
  const iconFill = fill || (isActive ? activeColor : inactiveColor);

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 16 16" fill="none" {...props}>
      <title>Pool</title>
      <g style={{ mixBlendMode: isMobile ? undefined : ('multiply' as const) }}>
        <path d="M8.00001 6.66667L6.66668 5.97232L6.66668 2L9.33334 2L9.33334 5.97232L8.00001 6.66667Z" fill={iconFill} />
        <path d="M8.00001 9.33333L6.66668 10.0277L6.66668 14L9.33334 14L9.33334 10.0277L8.00001 9.33333Z" fill={iconFill} />
        <rect x="15.3333" y="15.3334" width="14.6667" height="2.66667" transform="rotate(-180 15.3333 15.3334)" fill={iconFill} />
        <rect x="15.3333" y="3.33337" width="14.6667" height="2.66667" transform="rotate(-180 15.3333 3.33337)" fill={iconFill} />
      </g>
    </svg>
  );
};

export default PoolIcon;
