const CheckCircleIcon = ({ width = 16, height = 16, stroke = '#483534', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 16 16" fill="none" {...props}>
    <title>Check</title>
    <path
      d="M7.99968 14.6667C11.6817 14.6667 14.6663 11.682 14.6663 8.00004C14.6663 4.31804 11.6817 1.33337 7.99968 1.33337C4.31767 1.33337 1.33301 4.31804 1.33301 8.00004C1.33301 11.682 4.31767 14.6667 7.99968 14.6667Z"
      stroke={stroke}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6 7.99996L7.33333 9.33329L10 6.66663"
      stroke={stroke}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default CheckCircleIcon;
