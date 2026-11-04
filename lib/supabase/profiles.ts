import type { SupabaseClient } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'manager'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  role: UserRole
  created_at: string
}

/**
 * All profile reads go through this module. RLS enforces the actual
 * boundary — admins can read every profile, managers can only read their
 * own row — so these helpers stay simple pass-through queries.
 */

export async function getCurrentProfile(supabase: SupabaseClient): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw error
  return (data ?? null) as Profile | null
}

/** Managers available to assign students to. Only meaningful for admins —
 * RLS means a manager calling this only ever sees their own profile. */
export async function getManagers(supabase: SupabaseClient): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'manager')
    .order('full_name', { ascending: true })

  if (error) throw error
  return (data ?? []) as Profile[]
}
