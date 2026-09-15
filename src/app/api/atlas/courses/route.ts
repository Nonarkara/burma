import { NextRequest, NextResponse } from 'next/server';
import type { AtlasQuery, AtlasEntry } from '@/lib/atlas/types';

/**
 * GET /api/atlas/courses
 *
 * Stub. Phase 2 must wire this to:
 *  - Source adapters (ILO ISCO, depa Thailand, UNESCO Bangkok, ASEAN Skills)
 *  - Caching layer (Cloudflare KV or Neon)
 *  - `verifiedAt` freshness check (return stale flag if older than threshold)
 *
 * Returns an empty array for now so the UI can wire up without lying.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query: AtlasQuery = {
    type: url.searchParams.get('type') as AtlasEntry['type'] | undefined,
    country: url.searchParams.get('country') as AtlasEntry['location']['country'] | undefined,
    language: url.searchParams.get('language') as AtlasQuery['language'],
    tag: url.searchParams.get('tag') ?? undefined,
    trait: url.searchParams.get('trait') as AtlasQuery['trait'],
    free: url.searchParams.get('free') === 'true',
    remote: url.searchParams.get('remote') === 'true',
    limit: Number(url.searchParams.get('limit') ?? '20'),
  };

  return NextResponse.json({
    entries: [],
    query,
    notice: 'atlas_data_pending',
    note: 'Source adapters are not yet wired. Wire ILO, depa, UNESCO Bangkok, ASEAN Skills in Phase 2.',
  });
}