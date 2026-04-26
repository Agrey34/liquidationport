'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'

// --------------------------------------------------------------------------------
// LOGIN
// --------------------------------------------------------------------------------
export async function login(formData: FormData) {
  const supabase = await createClient()

  // Collect data
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Input Validation
  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  // Attempt login via Supabase
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Clear cache and redirect to dashboard
  revalidatePath('/', 'layout')
  redirect('/admin/products/create')
}

// --------------------------------------------------------------------------------
// SIGN UP
// --------------------------------------------------------------------------------
export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters long' }
  }

  // Attempt signup via Supabase
  // In production, this requires email verification by default
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/admin/products/create`,
      data: {
        role: 'admin', // This maps to app_metadata (optional usage depending on your exact RLS)
      }
    }
  })

  if (error) {
    return { error: error.message }
  }

  // Redirect to a verification pending page
  redirect('/admin-login/verify?message=Check your email to verify your account')
}

// --------------------------------------------------------------------------------
// FORGOT PASSWORD
// --------------------------------------------------------------------------------
export async function resetPasswordForEmail(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Email is required' }
  }

  // Trigger Supabase forgot password flow
  // We need to provide the exact URL we want the user to be redirected to after clicking the email link
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/admin-login/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/admin-login/verify?message=Password reset link has been sent to your email')
}

// --------------------------------------------------------------------------------
// UPDATE PASSWORD (Called from Reset Password page after clicking email link)
// --------------------------------------------------------------------------------
export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || password !== confirmPassword) {
    return { error: 'Passwords must match and cannot be empty' }
  }

  // Update the user's password (this relies on the active session set via the email link)
  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/admin-login?message=Password successfully updated')
}

// --------------------------------------------------------------------------------
// LOGOUT
// --------------------------------------------------------------------------------
export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  revalidatePath('/', 'layout')
  redirect('/admin-login')
}
