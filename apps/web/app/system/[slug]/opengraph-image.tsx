import { ImageResponse } from 'next/og';
import { getNotionPageBySlug } from '@/lib/notion';

export const alt = 'SODAX System Component';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// Use the same revalidation as the page
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Fetch page data from Notion (same as page.tsx)
  let title = 'SODAX System Component';
  try {
    const data = await getNotionPageBySlug('system', slug);
    if (data?.page) {
      title = data.page.properties.Title.title[0].plain_text;
    }
  } catch (error) {
    console.error('Failed to fetch system page for OG image:', error);
  }

  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001';

  try {
    const linkPreviewImage = await fetch(`${baseUrl}/glossary/link-preview-dynamic.png`).then(res => {
      if (!res.ok) throw new Error('Failed to fetch link preview dynamic image');
      return res.arrayBuffer();
    });

    return new ImageResponse(
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
        }}
      >
        {/* Background Image */}
        <img
          src={`data:image/png;base64,${Buffer.from(linkPreviewImage).toString('base64')}`}
          alt="Background"
          width={1200}
          height={630}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Title Text - positioned on the right, vertically centered */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '65%',
            padding: '60px 80px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: title.length > 60 ? '38px' : title.length > 40 ? '46px' : '52px',
              fontWeight: 700,
              color: '#483534',
              lineHeight: 1.2,
              maxWidth: '650px',
            }}
          >
            {title}
          </div>
        </div>
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
          alignItems: 'center',
          justifyContent: 'flex-end',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1f1f 50%, #1a1a1a 100%)',
          padding: '60px 80px',
        }}
      >
        <div
          style={{
            fontSize: title.length > 60 ? '38px' : title.length > 40 ? '46px' : '52px',
            fontWeight: 700,
            color: '#483534',
            lineHeight: 1.2,
            maxWidth: '650px',
            textAlign: 'left',
          }}
        >
          {title}
        </div>
      </div>,
      {
        ...size,
      },
    );
  }
}
