import type { Student } from '@/lib/students/types'

export function uniqueSorted(values: (string | null)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => !!v && v.trim() !== ''))).sort(
    (a, b) => a.localeCompare(b),
  )
}

export function getStartDates(students: Student[]): string[] {
  return Array.from(new Set(students.map((s) => s.start_date))).sort((a, b) =>
    a.localeCompare(b),
  )
}

export function getCohorts(students: Student[]): string[] {
  return uniqueSorted(students.map((s) => s.cohort))
}

export function getStatuses(students: Student[]): string[] {
  return uniqueSorted(students.map((s) => s.status))
}

export function getCourses(students: Student[]): string[] {
  return uniqueSorted(students.map((s) => s.course))
}

export interface StudentFilters {
  search: string
  startDate: string // 'all' or an ISO date, used by date tabs
  cohort: string // 'all' or a cohort value
  status: string // 'all' or a status value
  course: string // 'all' or a course value
  manager: string // 'all', 'unassigned', or a manager profile id — admin only
}

export const EMPTY_FILTERS: StudentFilters = {
  search: '',
  startDate: 'all',
  cohort: 'all',
  status: 'all',
  course: 'all',
  manager: 'all',
}

export function filterStudents(students: Student[], filters: StudentFilters): Student[] {
  const search = filters.search.trim().toLowerCase()

  return students.filter((s) => {
    if (filters.startDate !== 'all' && s.start_date !== filters.startDate) return false
    if (filters.cohort !== 'all' && (s.cohort ?? '') !== filters.cohort) return false
    if (filters.status !== 'all' && (s.status ?? '') !== filters.status) return false
    if (filters.course !== 'all' && (s.course ?? '') !== filters.course) return false
    if (filters.manager === 'unassigned' && s.manager_id) return false
    if (
      filters.manager !== 'all' &&
      filters.manager !== 'unassigned' &&
      s.manager_id !== filters.manager
    )
      return false

    if (search) {
      const haystack = [s.name, s.payment_email, s.platform_email, s.discord_name, s.phone, s.cohort]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(search)) return false
    }

    return true
  })
}

export function countBy(students: Student[], key: 'start_date' | 'cohort' | 'status'): {
  label: string
  count: number
}[] {
  const map = new Map<string, number>()
  for (const s of students) {
    const raw = s[key]
    const label = raw && raw.trim() !== '' ? raw : 'Unassigned'
    map.set(label, (map.get(label) ?? 0) + 1)
  }
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
}

const STARTING_SOON_STATUSES = new Set(['starting soon'])
const READY_STATUSES = new Set(['ready to start'])
const SET_UP_STATUSES = new Set(['set up'])

export function getDashboardStats(students: Student[]) {
  const normalize = (s: string | null) => (s ?? '').trim().toLowerCase()

  return {
    total: students.length,
    startingSoon: students.filter((s) => STARTING_SOON_STATUSES.has(normalize(s.status))).length,
    readyToStart: students.filter((s) => READY_STATUSES.has(normalize(s.status))).length,
    setUp: students.filter((s) => SET_UP_STATUSES.has(normalize(s.status))).length,
  }
}
