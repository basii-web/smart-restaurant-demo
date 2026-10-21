import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

export const demoMode = !supabase

export const formatCurrency = (amount, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)

export const generateOrderNumber = () =>
  `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

export const getTableLink = (tableNumber) => `${window.location.origin}/?table=${tableNumber}`

export const signInStaff = async (email, password) => {
  if (!supabase) {
    return {
      user: { email },
      session: { access_token: 'demo-token' },
      role: 'admin',
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    throw error
  }

  return data
}

export const signOutStaff = async () => {
  if (!supabase) {
    return { success: true }
  }

  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }

  return { success: true }
}
