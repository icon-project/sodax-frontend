const XCircleIcon = ({ width = 16, height = 16, stroke = '#483534', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 16 16" fill="none" {...props}>
    <title>X</title>
    <path
      d="M7.99968 14.6667C11.6816 14.6667 14.6663 11.6819 14.6663 8.00004C14.6663 4.31814 11.6816 1.33337 7.99968 1.33337C4.31778 1.33337 1.33301 4.31814 1.33301 8.00004C1.33301 11.6819 4.31778 14.6667 7.99968 14.6667Z"
      stroke={stroke}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M10 6L6 10" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 6L10 10" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default XCircleIcon;
