import { NextRequest, NextResponse } from 'next/server';
import { getLinkByShortCode } from '@/data/links';

/**
 * GET handler for shortened link redirects
 * Looks up the shortcode in the database and redirects to the original URL
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortcode: string }> },
) {
  const { shortcode } = await params;

  // Fetch the link from the database
  const link = await getLinkByShortCode(shortcode);

  // If link not found, return 404
  if (!link) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 });
  }

  // Redirect to the original URL
  return NextResponse.redirect(link.originalUrl, { status: 307 });
}
