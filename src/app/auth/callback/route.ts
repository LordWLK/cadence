import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const origin = request.nextUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  // Try to exchange the code for a session server-side
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data.session) {
        // Redirect to /auth/verify with tokens in the hash fragment
        // Hash fragments are never sent to the server = more secure
        const params = new URLSearchParams({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        return NextResponse.redirect(`${origin}/auth/verify#${params.toString()}`);
      }
    } catch {
      // Fall through to legacy redirect
    }
  }

  // Fallback: redirect with code for client-side exchange
  return NextResponse.redirect(`${origin}/auth/verify#code=${code}`);
}
