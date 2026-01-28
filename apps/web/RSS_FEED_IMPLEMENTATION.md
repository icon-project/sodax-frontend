# RSS Feed & Sitemap Implementation for SODAX

## Overview

Both the RSS feed and sitemap have been implemented following Vercel best practices for performance and cost optimization. Both are generated at build time with ISR (Incremental Static Regeneration), cached on the edge, and statically served to minimize database calls and function invocations.

---

## RSS Feed Implementation

### 1. RSS Feed Route Handler

**Location:** `/apps/web/app/news/feed.xml/route.ts`

The RSS feed is implemented as a Next.js Route Handler with the following optimizations:

- **Static Generation with ISR**: Uses `export const revalidate = 300` (5 minutes) to regenerate the feed periodically
- **Build-time Generation**: The feed is pre-rendered at build time and cached
- **CDN Caching**: Implements `Cache-Control` headers for edge caching:
  - `public, s-maxage=300` - Cache for 5 minutes on Vercel's edge network
  - `stale-while-revalidate=600` - Serve stale content while regenerating in the background

### 2. Performance Benefits

**Why This Approach?**

1. **No DB Calls on Every Request**: The feed is cached and only regenerates every 5 minutes
2. **Edge Network Distribution**: Served from Vercel's edge network closest to users
3. **Reduced Function Invocations**: Minimizes serverless function costs
4. **Background Revalidation**: Users always get instant responses while content updates in the background

**Architecture:**
```
User Request → Vercel Edge Cache (if fresh) → Served Immediately
                     ↓ (if stale)
            Background Revalidation → Update Cache
```

### 3. RSS Feed Features

The feed includes:
- **Standard RSS 2.0 format** with additional namespaces:
  - `atom:link` for feed discovery
  - `content:encoded` for rich content
  - `dc:creator` for Dublin Core metadata
- **Up to 50 most recent articles**
- **Article metadata**:
  - Title, description, and full article link
  - Publication date
  - Categories and tags
  - Featured images with `<enclosure>` tags
  - HTML content preview with CDATA
- **Channel information**:
  - Site branding and logo
  - Copyright notice
  - Last build date

### 4. RSS Feed Link Integration

**Location:** `/apps/web/app/news/page.tsx`

The RSS feed is discoverable in multiple ways:

1. **RSS Feed Box**: Added a dedicated section after the social channels box with:
   - RSS icon using Phosphor Icons
   - Clear description
   - Styled link matching the site design

2. **HTML `<link>` Tag**: Added to the page metadata for RSS reader auto-discovery:
   ```tsx
   alternates: {
     types: {
       'application/rss+xml': [{
         url: 'https://sodax.com/news/feed.xml',
         title: 'SODAX News RSS Feed'
       }]
     }
   }
   ```

### 5. Feed URL

**Production URL:** `https://sodax.com/news/feed.xml`

The feed is nested under the `/news` path to clearly indicate it contains news content and allows for future expansion (e.g., separate feeds for different content types).

## Testing

### Local Testing

1. Start the dev server:
   ```bash
   cd apps/web
   pnpm dev
   ```

2. Access the feed:
   ```bash
   curl http://localhost:3000/news/feed.xml
   ```

3. Validate the RSS feed using:
   - [W3C Feed Validation Service](https://validator.w3.org/feed/)
   - RSS reader applications (Feedly, Inoreader, NewsBlur, etc.)

### Production Testing

After deployment:
1. Verify the feed is accessible at `https://sodax.com/news/feed.xml`
2. Check Vercel logs to confirm no errors
3. Monitor function invocation counts (should be minimal)
4. Test with popular RSS readers

## Maintenance

### Updating the Feed

The feed automatically updates when:
- New articles are published
- Articles are modified
- The 5-minute revalidation period expires

No manual intervention is required.

### Monitoring

Monitor these metrics in Vercel:
- **Function invocations** for `/news/feed.xml` (should be ~12 per hour)
- **Bandwidth usage** (should be minimal due to edge caching)
- **Error rates** (should be near zero)

### Customization

To modify the feed behavior:

1. **Change revalidation period**: Edit `revalidate` constant in `/app/news/feed.xml/route.ts`
2. **Adjust article limit**: Modify `.limit(50)` in the database query
3. **Add/remove fields**: Edit the RSS XML template in the route handler
4. **Change caching strategy**: Update `Cache-Control` headers

## Best Practices Followed

✅ **Static Generation**: Feed is pre-rendered at build time  
✅ **ISR (Incremental Static Regeneration)**: Automatic updates without full rebuilds  
✅ **Edge Caching**: Served from CDN for minimal latency  
✅ **Stale-While-Revalidate**: Zero-downtime updates  
✅ **Proper XML Escaping**: Prevents malformed XML  
✅ **Rich Metadata**: Includes all standard RSS 2.0 fields  
✅ **Feed Discovery**: HTML `<link>` tag for auto-detection  
✅ **Mobile-friendly**: Responsive design for the RSS link  

## Dependencies

No additional packages required. Uses:
- Next.js built-in Route Handlers
- MongoDB connection (already configured)
- Phosphor Icons (already installed)

## SEO Benefits

1. **Content Syndication**: News aggregators and RSS readers can automatically discover and share content
2. **Backlinks**: RSS feeds in directories and readers create natural backlinks
3. **Feed Discovery**: Search engines recognize the RSS `<link>` tag in HTML
4. **Content Distribution**: Wider reach through RSS reader networks

## Future Enhancements

Potential improvements:
- Category-specific RSS feeds (e.g., `/news/feed/product.xml`)
- JSON Feed format support (`/news/feed.json`)
- Podcast RSS feed for video content
- Email newsletter integration using RSS-to-email services

---

## Sitemap Implementation

### 1. Enhanced Dynamic Sitemap

**Location:** `/apps/web/app/sitemap.ts`

The sitemap has been completely rewritten to dynamically include all CMS content:

- **Static Routes**: Core pages (home, swap, save, loans, migrate, discord)
- **News Articles**: All published news articles from `/news/[slug]`
- **Articles**: All published articles from `/articles/[slug]` (when available)
- **Glossary Terms**: All published glossary definitions from `/glossary/[slug]`
- **Community Pages**: `/community/soda-token`
- **Partner Pages**: `/partners/amped-finance` (and future partner case studies)

### 2. Performance Optimization

The sitemap uses the same caching strategy as the RSS feed:

```typescript
export const revalidate = 300; // Revalidate every 5 minutes
export const dynamic = 'force-static'; // Generate at build time
```

**Key Features:**
- ✅ Generated at build time with ISR
- ✅ Regenerates automatically every 5 minutes
- ✅ Cached on Vercel's edge network
- ✅ Zero database calls for cached requests
- ✅ Parallel database queries for optimal performance
- ✅ Graceful error handling - returns static routes if DB fails
- ✅ Individual error handling per collection

### 3. Bot Traffic Protection

Just like the RSS feed, the sitemap is protected against aggressive bot traffic:

**Scenario: Bots hitting `/sitemap.xml` every 2 seconds**
- **43,200 requests per day**
- **Actual function invocations:** ~288 per day (every 5 minutes)
- **Database queries:** ~288 per day
- **99.3% of requests:** Served from edge cache

### 4. Dynamic Content Discovery

The sitemap automatically includes:
- Index pages (`/articles`, `/glossary`) only if content exists
- All published content with accurate `lastModified` dates
- Appropriate priorities and change frequencies per content type

**Priority Structure:**
- Homepage: 1.0
- Core app features (swap, save, loans): 0.9
- News index: 0.9
- Individual news articles: 0.8
- Articles index: 0.8
- Individual articles: 0.7
- Glossary index: 0.7
- Individual glossary terms: 0.6

### 5. Sitemap URL

**Production URL:** `https://sodax.com/sitemap.xml`

The sitemap is automatically discovered by search engines and serves as the definitive index of your site's structure.

### 6. Testing the Sitemap

**Local Testing:**
```bash
curl http://localhost:3000/sitemap.xml
```

**Validate:**
- [XML Sitemap Validator](https://www.xml-sitemaps.com/validate-xml-sitemap.html)
- Google Search Console - Submit sitemap
- Bing Webmaster Tools - Submit sitemap

### 7. SEO Benefits

1. **Comprehensive Coverage**: All CMS content automatically indexed
2. **Fresh Content Discovery**: Search engines discover new content within 5 minutes
3. **Proper Priorities**: Guides search engines on page importance
4. **Change Frequency Hints**: Helps search engines optimize crawl frequency
5. **Accurate Timestamps**: `lastModified` dates from database records

### 8. Monitoring Both Feeds

Monitor these metrics in Vercel Analytics:

| Metric | Expected Value | Notes |
|--------|---------------|-------|
| `/sitemap.xml` invocations | ~288/day | One per 5-minute period |
| `/news/feed.xml` invocations | ~288/day | One per 5-minute period |
| Edge cache hit rate | >99% | Should be extremely high |
| Database queries | ~576/day total | Both feeds combined |
| Function execution time | <500ms | Should be fast |

### 9. Cost Comparison

**Without ISR & Caching:**
- Sitemap + RSS hit 100x/minute by bots
- 144,000 function invocations/day
- 144,000 database queries/day
- High bandwidth costs

**With Current Implementation:**
- 576 function invocations/day total
- 576 database queries/day total
- 99.6% cost reduction
- Edge-cached responses for instant delivery

---

## Shared Best Practices

Both implementations follow the same optimization patterns:

✅ **ISR (Incremental Static Regeneration)** - Automatic updates without rebuilds  
✅ **Edge Caching** - Served from CDN globally  
✅ **5-Minute Revalidation** - Fresh content without constant regeneration  
✅ **Build-Time Generation** - Pre-rendered for instant first response  
✅ **Parallel Queries** - Efficient database operations  
✅ **Error Handling** - Graceful degradation if services fail  
✅ **Bot-Proof** - Handles millions of requests without cost impact  

---

## Quick Reference

| Feature | URL | Update Frequency |
|---------|-----|------------------|
| RSS Feed | `/news/feed.xml` | Every 5 minutes |
| Sitemap | `/sitemap.xml` | Every 5 minutes |
| Edge Cache | Both | 5 minute TTL |
| DB Queries | Both | ~288/day each |

Both feeds are production-ready and optimized for high-traffic scenarios! 🚀
