export interface StudentManager {
  id: string
  full_name: string | null
  email: string | null
}

export interface Student {
  id: string
  start_date: string // date, ISO yyyy-mm-dd
  cohort: string | null
  name: string | null
  payment_email: string | null
  platform_email: string | null
  discord_name: string | null
  phone: string | null
  script: string | null
  status: string | null
  course: string | null
  sub_activated_1: string | null
  sub_activated_2: string | null
  s0_started: string | null
  s1_started: string | null
  can_move: string | null
  hubspot_link: string | null
  hilos_product_link: string | null
  lms_profile_link: string | null
  notes: string | null
  manager_id: string | null
  manager: StudentManager | null
  created_at: string
  updated_at: string
}

export type StudentInput = Omit<
  Student,
  'id' | 'created_at' | 'updated_at' | 'manager'
>

export const STUDENT_TEXT_FIELDS: {
  key: keyof StudentInput
  label: string
}[] = [
  { key: 'status', label: 'Status' },
  { key: 'course', label: 'Course' },
  { key: 'script', label: 'Script' },
  { key: 'sub_activated_1', label: 'Sub Activated 1' },
  { key: 'sub_activated_2', label: 'Sub Activated 2' },
  { key: 's0_started', label: 'S0 Started' },
  { key: 's1_started', label: 'S1 Started' },
  { key: 'can_move', label: 'Can Move?' },
]

// Single shared source of truth for Status. Used by the Add Student form,
// Edit Student form, and the inline table editor (InlineStatusSelect) so
// there is exactly one place to add/remove a valid status.
export const STATUS_OPTIONS = [
  'Starting Soon',
  'Ready to Start',
  'Prep Call',
  'Set Up',
  'Active',
  'Paused',
  'Completed',
  'Dropped',
]

// The activity fields (sub_activated_1/2, s0/s1_started, can_move) are
// strictly binary. Canonical stored values are uppercase "YES"/"NO" — see
// normalizeInput() in lib/supabase/students.ts. Shared by the Add/Edit forms
// and the inline table editor (InlineYesNoSelect).
export const YES_NO_OPTIONS = ['YES', 'NO'] as const
export type YesNo = (typeof YES_NO_OPTIONS)[number]

/** Fields that are strictly YES/NO — never free text. */
export const YES_NO_FIELDS: (keyof StudentInput)[] = [
  'sub_activated_1',
  'sub_activated_2',
  's0_started',
  's1_started',
  'can_move',
]

export const STUDENT_COLUMNS: {
  key: keyof Student
  label: string
  sticky?: boolean
}[] = [
  { key: 'start_date', label: 'Start Date', sticky: true },
  { key: 'cohort', label: 'Cohort' },
  { key: 'name', label: 'Name', sticky: true },
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

export const EMPTY_STUDENT_INPUT: StudentInput = {
  start_date: new Date().toISOString().slice(0, 10),
  cohort: '',
  name: '',
  payment_email: '',
  platform_email: '',
  discord_name: '',
  phone: '',
  script: '',
  status: '',
  course: '',
  sub_activated_1: '',
  sub_activated_2: '',
  s0_started: '',
  s1_started: '',
  can_move: '',
  hubspot_link: '',
  hilos_product_link: '',
  lms_profile_link: '',
  notes: '',
  manager_id: null,
}
