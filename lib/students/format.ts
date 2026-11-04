import { format, parseISO, isValid } from 'date-fns'

/** Formats an ISO date string (yyyy-mm-dd) as MM/dd/yyyy for display. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const parsed = parseISO(iso)
  if (!isValid(parsed)) return iso
  return format(parsed, 'MM/dd/yyyy')
}

export function formatDateLong(iso: string | null | undefined): string {
  if (!iso) return '—'
  const parsed = parseISO(iso)
  if (!isValid(parsed)) return iso
  return format(parsed, 'MMMM d, yyyy')
}
