'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { getCleanErrorMessage } from '../../lib/error-utils'

// --------------------------------------------------------------------------------
// LOGIN
// --------------------------------------------------------------------------------
export async function login(formData: FormData) {
  const supabase = await createClient()

  // Collect data
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const formRedirect = formData.get('redirectTo') as string | null

  // Input Validation
  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  // Attempt login via Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: getCleanErrorMessage(error, 'Unable to sign in. Please verify your credentials and try again.') }
  }

  // Determine target path: prioritize explicit redirectTo, ensure valid admin path
  let targetPath = '/admin'
  if (formRedirect && formRedirect.startsWith('/admin') && !formRedirect.startsWith('/admin-login') && !formRedirect.startsWith('/admin-signup')) {
    targetPath = formRedirect
  }

  // Clear cache and redirect to dashboard
  revalidatePath('/', 'layout')
  redirect(targetPath)
}

// --------------------------------------------------------------------------------
// SIGN UP
// --------------------------------------------------------------------------------
export async function signup(formData: FormData) {
  const supabase = await createClient()

  const firstName = (formData.get('firstName') as string)?.trim() || ''
  const lastName = (formData.get('lastName') as string)?.trim() || ''
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
        first_name: firstName,
        last_name: lastName,
        full_name: [firstName, lastName].filter(Boolean).join(' '),
        role: 'admin',
      }
    }
  })

  if (error) {
    return { error: getCleanErrorMessage(error, 'Unable to create account. Please try again shortly.') }
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
    return { error: getCleanErrorMessage(error, 'Unable to send password reset link. Please try again later.') }
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
    return { error: getCleanErrorMessage(error, 'Unable to update password. Please try again.') }
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
