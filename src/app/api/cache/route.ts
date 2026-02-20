import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST() {
  try {
    // Revalidate all API routes
    revalidatePath('/api/scanner', 'page');
    
    // Also clear specific cache tags if used
    try {
      revalidateTag('market-data');
      revalidateTag('tickers');
      revalidateTag('klines');
      revalidateTag('funding');
      revalidateTag('oi');
    } catch {
      // Tags might not exist, ignore
    }
    
    return NextResponse.json({
      success: true,
      message: 'Cache cleared',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to clear cache',
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to clear cache',
  });
}
