import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'SODAX News - Latest Updates & Insights';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001';

  try {
    const linkPreviewImage = await fetch(`${baseUrl}/news/link-preview.png`).then(res => {
      if (!res.ok) throw new Error('Failed to fetch link preview image');
      return res.arrayBuffer();
    });

    return new ImageResponse(
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
        }}
      >
        <img
          src={`data:image/png;base64,${Buffer.from(linkPreviewImage).toString('base64')}`}
          alt="SODAX News"
          width={1200}
          height={630}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>,
      {
        ...size,
      },
    );
  } catch (error) {
    console.error('Error generating OpenGraph image:', error);

    // Return fallback OpenGraph image with text only
    return new ImageResponse(
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1f1f 50%, #1a1a1a 100%)',
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
            SODAX News
          </div>
          <div
            style={{
              fontSize: '32px',
              color: 'rgba(255, 255, 255, 0.8)',
              textAlign: 'center',
            }}
          >
            Latest Updates & Insights
          </div>
        </div>
      </div>,
      {
        ...size,
      },
    );
  }
}
