import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Amped Finance Case Study | SODAX Partners';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// Partner-specific configuration
const partnerName = 'Amped Finance';
const partnerLogoPath = '/partners/amped-finance/logo.png';

export default async function Image() {
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001';

  try {
    const [backgroundData, partnerLogoData, interExtraBold] = await Promise.all([
      fetch(`${baseUrl}/partners/link-preview-dynamic.jpg`).then(res => {
        if (!res.ok) throw new Error('Failed to fetch background');
        return res.arrayBuffer();
      }),
      fetch(`${baseUrl}${partnerLogoPath}`).then(res => {
        if (!res.ok) throw new Error('Failed to fetch partner logo');
        return res.arrayBuffer();
      }),
      fetch('https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZs.woff').then(
        res => res.arrayBuffer(),
      ),
    ]);

    return new ImageResponse(
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          position: 'relative',
        }}
      >
        {/* Background Image */}
        <img
          src={`data:image/jpeg;base64,${Buffer.from(backgroundData).toString('base64')}`}
          alt=""
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Content Overlay */}
        <div
          style={{
            position: 'absolute',
            top: -20,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingLeft: '150px',
            paddingTop: '0px',
          }}
        >
          {/* Partner Logo + Name */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
            }}
          >
            {/* Partner Logo */}
            <img
              src={`data:image/png;base64,${Buffer.from(partnerLogoData).toString('base64')}`}
              alt={`${partnerName} Logo`}
              width="140"
              height="140"
              style={{
                objectFit: 'contain',
                marginTop: '-30px',
              }}
            />

            {/* Partner Name */}
            <div
              style={{
                fontSize: '58px',
                fontWeight: 800,
                color: '#483534',
              }}
            >
              {partnerName}
            </div>
          </div>
        </div>
      </div>,
      {
        ...size,
        fonts: [
          {
            name: 'Inter',
            data: interExtraBold,
            style: 'normal',
            weight: 800,
          },
        ],
      },
    );
  } catch (error) {
    console.error('Error generating OpenGraph image:', error);

    // Return fallback with text only
    return new ImageResponse(
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: '#f8f3f3',
          paddingLeft: '112px',
        }}
      >
        <div
          style={{
            fontSize: '24px',
            fontWeight: 500,
            color: '#8e7e7d',
            letterSpacing: '0.05em',
            marginBottom: '8px',
          }}
        >
          CASE STUDY
        </div>
        <div
          style={{
            fontSize: '48px',
            fontWeight: 700,
            color: '#483534',
          }}
        >
          {partnerName}
        </div>
      </div>,
      {
        ...size,
      },
    );
  }
}
