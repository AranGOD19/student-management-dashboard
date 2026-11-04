'use client'

/**
 * Column visibility for the students table. Kept separate from
 * STUDENT_COLUMNS (lib/students/types.ts) because that list drives CSV
 * import field mapping — a different concern that must not be affected by
 * which columns a user chooses to show/hide on screen.
 */

/** Every togglable column, in table display order. "manager" is included
 * here even though it only renders for admins — the toolbar/table filter it
 * out for managers before this list ever reaches the checkbox menu. */
export const STUDENT_TABLE_COLUMNS: { key: string; label: string }[] = [
  { key: 'start_date', label: 'Start Date' },
  { key: 'cohort', label: 'Cohort' },
  { key: 'name', label: 'Name' },
  { key: 'manager', label: 'Manager' },
  { key: 'payment_email', label: 'Payment Email' },
  { key: 'platform_email', label: 'Platform Email (LMS)' },
  { key: 'discord_name', label: 'Discord Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'script', label: 'Script' },
  { key: 'status', label: 'Status' },
  { key: 'course', label: 'Course' },
  { key: 'sub_activated_1', label: 'Sub Activated 1' },
  { key: 'sub_activated_2', label: 'Sub Activated 2' },
  { key: 's0_started', label: 'S0 Started' },
  { key: 's1_started', label: 'S1 Started' },
  { key: 'can_move', label: 'Can Move?' },
  { key: 'hubspot_link', label: 'Link to HubSpot' },
  { key: 'hilos_product_link', label: 'Link Hilos Product' },
  { key: 'lms_profile_link', label: 'Link to a profile (LMS)' },
  { key: 'notes', label: 'Notes' },
]

export type StudentColumnKey = (typeof STUDENT_TABLE_COLUMNS)[number]['key']

/** All columns are visible by default — this keeps every column the
 * requirements call out (Name, Manager, Status, the activity columns, the
 * date, and Actions — Actions is structural chrome and isn't a togglable
 * data column at all) visible out of the box. */
export const DEFAULT_VISIBLE_COLUMNS: StudentColumnKey[] = STUDENT_TABLE_COLUMNS.map(
  (c) => c.key,
)

function storageKey(userId: string) {
  return `student-ops:visible-columns:${userId}`
}

/** Reads saved column visibility for this user from localStorage. Falls
 * back to the default (all visible) if nothing is saved yet, the value is
 * corrupt, or localStorage is unavailable (e.g. during SSR). */
export function loadVisibleColumns(userId: string): Set<StudentColumnKey> {
  if (typeof window === 'undefined') return new Set(DEFAULT_VISIBLE_COLUMNS)
  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    if (!raw) return new Set(DEFAULT_VISIBLE_COLUMNS)
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set(DEFAULT_VISIBLE_COLUMNS)
    const known = new Set(STUDENT_TABLE_COLUMNS.map((c) => c.key))
    const filtered = parsed.filter((key): key is StudentColumnKey =>
      typeof key === 'string' && known.has(key),
    )
    return new Set(filtered)
  } catch {
    return new Set(DEFAULT_VISIBLE_COLUMNS)
  }
}

export function saveVisibleColumns(userId: string, visible: Set<StudentColumnKey>) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(Array.from(visible)))
  } catch {
    // Ignore write failures (e.g. private browsing quota) — visibility just
    // won't persist for this session, which is a harmless degradation.
  }
}
