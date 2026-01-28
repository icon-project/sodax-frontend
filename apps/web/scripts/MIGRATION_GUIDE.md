# News Migration Guide: Payload CMS → SODAX Custom CMS

This guide explains how to migrate your 20 news articles from the old Payload CMS to the new custom SODAX CMS.

## Overview

**Old Database (Payload CMS):**
- Connection: `DATABASE_URI_OLD` in `.env.local`
- Database: `test`
- Collection: `posts` (20 articles)
- Media: `media` collection with image metadata
- Format: Payload's Lexical Editor JSON

**New Database (SODAX Custom CMS):**
- Connection: `DATABASE_URI` in `.env.local`
- Database: `sodax-cms`
- Collection: `news`
- Format: Tiptap HTML

## Articles to Migrate

All 20 articles from your old CMS, including:
- "Introducing SODAX" (May 2025)
- Monthly updates (April 2025 - January 2026)
- Partnership announcements (LightLink, Houdini Swap)
- Technical releases (SDK launches, Ethereum launch, etc.)

## Key Differences

| Field | Payload CMS | SODAX Custom CMS |
|-------|-------------|------------------|
| Content Format | Lexical JSON | Tiptap HTML |
| Images | MongoDB ObjectId refs | Vercel Blob URLs |
| Authors | ObjectId array | authorId + authorName strings |
| Categories | ObjectId array | string array |
| Status Field | `_status` | `published` boolean |
| Meta Fields | Nested `meta` object | Top-level fields |

## Migration Steps

### 1. Review the Migration Script

The script `scripts/migrate-news.ts` will:
- Connect to both databases
- Convert Lexical JSON → HTML
- Transform Payload structure → SODAX structure
- Handle image references
- Skip duplicates (by slug)
- Provide detailed progress logs

### 2. Prepare for Migration

```bash
# Ensure you have both database URIs in .env.local
DATABASE_URI_OLD=mongodb+srv://davidpayload:...@payload...
DATABASE_URI=mongodb+srv://David:...@sodaxcluster0...

# Install dependencies if needed
cd apps/web
pnpm install
```

### 3. Run the Migration (Dry Run First)

```bash
# Run the migration script
pnpm tsx scripts/migrate-news.ts
```

The script will:
- ✅ Show progress for each article
- ⏭️  Skip articles that already exist
- ❌ Report any errors
- 📊 Display summary statistics

### 4. Upload Images Manually

**📸 Image Strategy:** Images will be uploaded manually through the CMS admin after migration.

For each of the 20 articles:
1. Go to `/cms/news` and click "Edit" on the article
2. Download the hero image from the old site (or from local Payload storage)
3. Upload through the "Hero Image" field (uses Vercel Blob automatically)
4. Save the article

**Why manual?** With only 20 articles, this is faster and simpler than scripting image migration. Plus, you can review/optimize each image during upload.

### 5. Post-Migration Checklist

After migration, review in the CMS:

- [ ] All 20 articles appear in `/cms/news`
- [ ] Content formatting looks correct
- [ ] Images are displayed properly
- [ ] Published dates are correct
- [ ] Slugs work (check for duplicates)
- [ ] Meta descriptions are filled
- [ ] Update author information if needed
- [ ] Add categories/tags as appropriate

### 6. Verify on Public Pages

Once public news pages are built:

- [ ] Articles render correctly
- [ ] Images load properly
- [ ] Links work (internal and external)
- [ ] SEO metadata is correct
- [ ] Slugs are URL-friendly

## Content Conversion Details

### Lexical → HTML Conversion

The script converts Payload's Lexical editor format to HTML:

| Lexical Type | HTML Output |
|--------------|-------------|
| `paragraph` | `<p>` |
| `heading` | `<h2>`, `<h3>`, etc. |
| `list` (bullet) | `<ul><li>` |
| `list` (numbered) | `<ol><li>` |
| `link` | `<a href="">` |
| `horizontalrule` | `<hr />` |
| `text` with format=1 | `<strong>` (bold) |
| `text` with format=2 | `<em>` (italic) |

### Known Limitations

1. **Complex nested structures** may need manual review
2. **Code blocks** are converted but syntax highlighting might differ
3. **Custom Payload blocks** need manual handling
4. **Image embeds in content** (not hero images) will need manual fixing

## Rollback Plan

If you need to rollback:

```bash
# Connect to new database
mongosh "mongodb+srv://David:...@sodaxcluster0..."

# Delete all migrated news
use sodax-cms
db.news.deleteMany({ authorId: "migration-script" })
```

## Troubleshooting

### "Already exists" messages
- Articles with the same slug already exist
- Safe to ignore if content is correct
- Or delete existing and re-run migration

### Content formatting issues
- Review the Lexical → HTML conversion in the script
- Add custom handlers for specific content types
- Manually fix complex articles in the CMS

### Missing images
- Check media collection in old database
- Verify image ObjectId references
- Upload images manually if needed

### Database connection errors
- Verify environment variables
- Check MongoDB Atlas network access
- Ensure correct database names

## Need Help?

Common issues:

1. **Script fails to run:** Ensure `tsx` is installed (`pnpm add -D tsx`)
2. **MongoDB connection:** Check IP whitelist in Atlas
3. **Content broken:** May need to adjust Lexical parser for specific content
4. **Images not loading:** See "Handle Images" section above

## Next Steps After Migration

1. ✅ Verify all content in `/cms/news`
2. 🎨 Build public news pages (`/news` and `/news/[slug]`)
3. 🔍 Implement SEO metadata
4. 📸 Fix any image issues
5. 🏷️ Add categories and tags
6. 👥 Update author information
7. 🚀 Deploy and test

---

**Migration Status:** Ready to run
**Estimated Time:** ~2-3 minutes for 20 articles
**Risk Level:** Low (script skips duplicates, doesn't delete old data)
