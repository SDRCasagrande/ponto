import { NextRequest, NextResponse } from 'next/server';
import { syncClock, syncAllClocks } from '@/lib/sync-engine';

export async function POST(req: NextRequest) {
  const { clockId } = await req.json();

  if (clockId) {
    const result = await syncClock(clockId);
    return NextResponse.json(result);
  }

  // Sync all
  const results = await syncAllClocks();
  return NextResponse.json({ results });
}
