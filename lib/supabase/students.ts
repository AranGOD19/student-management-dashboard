import type { SupabaseClient } from '@supabase/supabase-js'
import { YES_NO_FIELDS, type Student, type StudentInput } from '@/lib/students/types'

/**
 * All student reads/writes go through this module, regardless of whether the
 * caller holds a server client (RSC, route handler) or a browser client
 * (client components). The `students` table is the single source of truth —
 * GENERAL, date tabs, and cohort views are always live queries against it,
 * never separate tables or cached copies.
 *
 * Row visibility/mutability is enforced by Postgres RLS (see the
 * `multi_user_roles_and_rls` migration) — admins see/edit every row,
 * managers only see/edit rows where `manager_id = auth.uid()`. These helpers
 * never filter by role client-side; the same query just returns fewer rows
 * for a manager because Postgres does the filtering.
 */

// Every read joins the assigned manager's profile so the UI can show a name
// instead of a bare UUID.
const STUDENT_SELECT = '*, manager:profiles(id, full_name, email)'

export async function getStudents(supabase: SupabaseClient): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select(STUDENT_SELECT)
    .order('start_date', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as Student[]
}

export async function getStudentById(
  supabase: SupabaseClient,
  id: string,
): Promise<Student | null> {
  const { data, error } = await supabase
    .from('students')
    .select(STUDENT_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return (data ?? null) as unknown as Student | null
}

export async function createStudent(
  supabase: SupabaseClient,
  input: StudentInput,
): Promise<Student> {
  const { data, error } = await supabase
    .from('students')
    .insert([normalizeInput(input)])
    .select(STUDENT_SELECT)
    .single()

  if (error) throw error
  return data as unknown as Student
}

export async function updateStudent(
  supabase: SupabaseClient,
  id: string,
  input: Partial<StudentInput>,
): Promise<Student> {
  const { data, error } = await supabase
    .from('students')
    .update(normalizeInput(input))
    .eq('id', id)
    .select(STUDENT_SELECT)
    .single()

  if (error) throw error
  return data as unknown as Student
}

/**
 * Single-field update used by the inline table editors (status, and the
 * YES/NO activity fields). Kept separate from updateStudent so the table can
 * persist one cell without needing the rest of the form's state, and so a
 * rejected RLS update surfaces a plain error the caller can revert on.
 */
export async function updateStudentField(
  supabase: SupabaseClient,
  id: string,
  field: keyof StudentInput,
  value: string | null,
): Promise<Student> {
  const { data, error } = await supabase
    .from('students')
    .update(normalizeInput({ [field]: value } as Partial<StudentInput>))
    .eq('id', id)
    .select(STUDENT_SELECT)
    .single()

  if (error) throw error
  return data as unknown as Student
}

export async function deleteStudent(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from('students').delete().eq('id', id)
  if (error) throw error
}

/** Bulk insert used by the CSV importer. Runs as one insert so a partial
 * failure does not leave half the batch committed. */
export async function bulkCreateStudents(
  supabase: SupabaseClient,
  inputs: StudentInput[],
): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .insert(inputs.map(normalizeInput))
    .select(STUDENT_SELECT)

  if (error) throw error
  return (data ?? []) as unknown as Student[]
}

const YES_NO_FIELD_SET = new Set<string>(YES_NO_FIELDS)

/** Maps loose truthy/falsy spellings (yes, Y, true, 1, ...) to the canonical
 * "YES"/"NO" stored in the database. Anything unrecognized falls back to
 * null rather than persisting a stray free-text value. */
function toCanonicalYesNo(value: string): 'YES' | 'NO' | null {
  const normalized = value.trim().toLowerCase()
  if (['yes', 'y', 'true', '1'].includes(normalized)) return 'YES'
  if (['no', 'n', 'false', '0'].includes(normalized)) return 'NO'
  if (normalized === 'yes' || normalized === 'no') return normalized.toUpperCase() as 'YES' | 'NO'
  return null
}

// Empty strings for optional text columns are stored as null so filters and
// "unassigned" grouping behave consistently. Binary activity fields are
// additionally canonicalized to exactly "YES" or "NO".
function normalizeInput<T extends Partial<StudentInput>>(input: T): T {
  const normalized = { ...input } as Record<string, unknown>
  for (const [key, value] of Object.entries(normalized)) {
    if (key === 'start_date' || key === 'manager_id') continue
    if (YES_NO_FIELD_SET.has(key)) {
      normalized[key] = typeof value === 'string' && value.trim() !== '' ? toCanonicalYesNo(value) : null
      continue
    }
    if (typeof value === 'string' && value.trim() === '') {
      normalized[key] = null
    }
  }
  return normalized as T
}
