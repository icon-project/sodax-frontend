import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Amped Finance x SODAX Partnership';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  // Fetch logo images using absolute URLs
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3001';
  
  const sodaxLogo = fetch(`${baseUrl}/symbol.png`).then((res) => res.arrayBuffer());
  const ampedLogoResponse = fetch(`${baseUrl}/partners/amped-finance/logo.svg`).then((res) => res.text());

  const [sodaxLogoData, ampedLogoSvg] = await Promise.all([sodaxLogo, ampedLogoResponse]);
  
  // Replace CSS variable with actual color
  const ampedLogoData = ampedLogoSvg.replace(/var\(--fill-0,\s*#F76B8A\)/g, '#F76B8A');

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(to right, #a55c55, #000000)',
          gap: '80px',
          padding: '60px',
        }}
      >
        {/* SodaX Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={`data:image/png;base64,${Buffer.from(sodaxLogoData).toString('base64')}`}
            alt="SodaX Logo"
            width="280"
            height="280"
            style={{
              objectFit: 'contain',
            }}
          />
        </div>

        {/* X Separator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '80px',
            fontWeight: 'bold',
            color: 'white',
            opacity: 0.5,
          }}
        >
          ×
        </div>

        {/* Amped Finance Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={`data:image/svg+xml;base64,${Buffer.from(ampedLogoData).toString('base64')}`}
            alt="Amped Finance Logo"
            width="280"
            height="280"
            style={{
              objectFit: 'contain',
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
