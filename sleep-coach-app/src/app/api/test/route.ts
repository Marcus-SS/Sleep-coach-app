import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://kkbysdcykwmofvbfvwtf.supabase.co/rest/v1/test?select=*', {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
      }
    });
    const data = await res.json();
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.toString() }, { status: 500 });
  }
}