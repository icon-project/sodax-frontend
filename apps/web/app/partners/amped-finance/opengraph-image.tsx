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
  
  try {
    const sodaxLogo = fetch(`${baseUrl}/symbol.png`).then((res) => {
      if (!res.ok) throw new Error('Failed to fetch SODAX logo');
      return res.arrayBuffer();
    });
    
    const ampedLogo = fetch(`${baseUrl}/partners/amped-finance/logo.png`).then((res) => {
      if (!res.ok) throw new Error('Failed to fetch Amped Finance logo');
      return res.arrayBuffer();
    });

    const [sodaxLogoData, ampedLogoData] = await Promise.all([sodaxLogo, ampedLogo]);
  
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
              src={`data:image/png;base64,${Buffer.from(ampedLogoData).toString('base64')}`}
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
  } catch (error) {
    console.error('Error generating OpenGraph image:', error);
    
    // Return fallback OpenGraph image with text only
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(to right, #a55c55, #000000)',
            padding: '60px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
            }}
          >
            <div
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center',
              }}
            >
              Amped Finance × SODAX
            </div>
            <div
              style={{
                fontSize: '36px',
                color: 'rgba(255, 255, 255, 0.8)',
                textAlign: 'center',
              }}
            >
              Partnership Case Study
            </div>
          </div>
        </div>
      ),
      {
        ...size,
      }
    );
  }
}
