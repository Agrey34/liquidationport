import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '../../../lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath('/', 'layout');
  } catch (err) {
    console.error('[Signout Route] Error signing out on server:', err);
  }

  return NextResponse.json({ success: true });
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath('/', 'layout');
  } catch (err) {
    console.error('[Signout Route] Error signing out on server:', err);
  }

  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/`, { status: 303 });
}
