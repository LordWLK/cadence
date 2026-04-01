import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const origin = request.nextUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  // The code exchange happens client-side via Supabase's detectSessionInUrl
  // We redirect to home and let the client handle the token exchange
  return NextResponse.redirect(`${origin}/?code=${code}`);
}
