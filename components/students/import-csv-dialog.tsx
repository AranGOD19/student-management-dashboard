'use client'

import { useRef, useState } from 'react'
import Papa from 'papaparse'
import { AlertTriangle, Download, FileUp, Loader2, UploadCloud } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { StudentInput } from '@/lib/students/types'
import { STUDENT_COLUMNS } from '@/lib/students/types'
import type { Profile, UserRole } from '@/lib/supabase/profiles'

/** Triggers a client-side download of a blank CSV template with one header
 * row for every importable student field (plus manager email, admin-only). */
function downloadCsvTemplate(includeManagerEmail: boolean) {
  const headers = STUDENT_COLUMNS.map((c) => c.label)
  if (includeManagerEmail) headers.push('Manager Email')
  const csv = `${headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(',')}\n`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'student-import-template.csv'
  link.click()
  URL.revokeObjectURL(url)
}

const NONE_VALUE = '__none__'
const EMAIL_COLUMN_MODE = '__email_column__'
const UNASSIGNED_MANAGER = '__unassigned__'

// Best-effort auto-mapping from common header spellings to our columns.
const HEADER_ALIASES: Record<string, string> = {
  'start date': 'start_date',
  date: 'start_date',
  cohort: 'cohort',
  name: 'name',
  'full name': 'name',
  'payment email': 'payment_email',
  'platform email': 'platform_email',
  'platform email (lms)': 'platform_email',
  'discord name': 'discord_name',
  discord: 'discord_name',
  phone: 'phone',
  script: 'script',
  status: 'status',
  course: 'course',
  'sub activated 1': 'sub_activated_1',
  'sub activated 2': 'sub_activated_2',
  's0 started': 's0_started',
  's1 started': 's1_started',
  'can move': 'can_move',
  'can move?': 'can_move',
  'link to hubspot': 'hubspot_link',
  hubspot: 'hubspot_link',
  'link hilos product': 'hilos_product_link',
  'hilos product': 'hilos_product_link',
  'link to a profile (lms)': 'lms_profile_link',
  'lms profile': 'lms_profile_link',
  notes: 'notes',
  manager_email: 'manager_email',
  'manager email': 'manager_email',
}

function toIsoDate(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  // yyyy-mm-dd already
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  // m/d/yyyy or m/d/yy
  const parts = trimmed.split(/[/-]/)
  if (parts.length === 3) {
    let [m, d, y] = parts
    if (y.length === 2) y = `20${y}`
    if (m.length <= 2 && d.length <= 2 && y.length === 4) {
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
  }
  return trimmed
}

export function ImportCsvDialog({
  open,
  onOpenChange,
  onImport,
  role,
  managers,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (inputs: StudentInput[]) => Promise<void>
  role: UserRole
  /** Admin only — managers always import into their own roster, so this is
   * empty for them and the manager-assignment picker below is hidden. */
  managers: Profile[]
}) {
  const isAdmin = role === 'admin'
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  // Either a single manager id for the whole batch, EMAIL_COLUMN_MODE (use a
  // manager_email CSV column), or UNASSIGNED_MANAGER to leave students
  // unassigned.
  const [managerAssignment, setManagerAssignment] = useState(UNASSIGNED_MANAGER)

  function reset() {
    setFileName(null)
    setHeaders([])
    setRows([])
    setMapping({})
    setError(null)
    setManagerAssignment(UNASSIGNED_MANAGER)
    setShowPreview(false)
  }

  const managersByEmail = new Map(
    managers.filter((m) => m.email).map((m) => [m.email!.toLowerCase(), m]),
  )

  /** Resolves the manager_id for one parsed CSV row given the current
   * assignment mode. Returns null (unassigned) if manager_email mode is on
   * but the row's email doesn't match any known manager. */
  function resolveManagerId(row: Record<string, string>): string | null {
    if (managerAssignment === EMAIL_COLUMN_MODE) {
      const emailHeader = Object.entries(mapping).find(([, field]) => field === 'manager_email')?.[0]
      const email = emailHeader ? row[emailHeader]?.trim().toLowerCase() : ''
      return email ? managersByEmail.get(email)?.id ?? null : null
    }
    if (managerAssignment === UNASSIGNED_MANAGER) {
      return null
    }
    // Any other value is a manager profile id selected for the whole batch.
    return managerAssignment
  }

  function handleFile(file: File) {
    setError(null)
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const parsedHeaders = result.meta.fields ?? []
        if (parsedHeaders.length === 0) {
          setError('Could not find a header row in this CSV.')
          return
        }
        setFileName(file.name)
        setHeaders(parsedHeaders)
        setRows(result.data)

        const initialMapping: Record<string, string> = {}
        for (const header of parsedHeaders) {
          const normalized = header.trim().toLowerCase()
          if (HEADER_ALIASES[normalized]) {
            initialMapping[header] = HEADER_ALIASES[normalized]
          }
        }
        setMapping(initialMapping)
      },
      error: (err) => setError(err.message),
    })
  }

  const mappedToStartDate = Object.values(mapping).includes('start_date')
  const mappedToManagerEmail = Object.values(mapping).includes('manager_email')

  function buildInputs(): StudentInput[] {
    return rows
      .map((row) => {
        const record: Record<string, string> = {}
        for (const [header, field] of Object.entries(mapping)) {
          if (field === NONE_VALUE) continue
          record[field] = row[header] ?? ''
        }
        return {
          start_date: toIsoDate(record.start_date ?? ''),
          cohort: record.cohort ?? '',
          name: record.name ?? '',
          payment_email: record.payment_email ?? '',
          platform_email: record.platform_email ?? '',
          discord_name: record.discord_name ?? '',
          phone: record.phone ?? '',
          script: record.script ?? '',
          status: record.status ?? '',
          course: record.course ?? '',
          sub_activated_1: record.sub_activated_1 ?? '',
          sub_activated_2: record.sub_activated_2 ?? '',
          s0_started: record.s0_started ?? '',
          s1_started: record.s1_started ?? '',
          can_move: record.can_move ?? '',
          hubspot_link: record.hubspot_link ?? '',
          hilos_product_link: record.hilos_product_link ?? '',
          lms_profile_link: record.lms_profile_link ?? '',
          notes: record.notes ?? '',
          manager_id: resolveManagerId(row),
        }
      })
      .filter((r) => r.start_date && /^\d{4}-\d{2}-\d{2}$/.test(r.start_date))
  }

  function handleReviewImport() {
    if (!mappedToStartDate) {
      setError('Map a column to "Start Date" before importing — it is required.')
      return
    }
    if (managerAssignment === EMAIL_COLUMN_MODE && !mappedToManagerEmail) {
      setError('Map a column to "Manager email" before using email-based assignment.')
      return
    }
    const inputs = buildInputs()
    if (inputs.length === 0) {
      setError('No valid rows found — check that Start Date values parse as dates.')
      return
    }
    setError(null)
    setShowPreview(true)
  }

  async function handleConfirmImport() {
    setIsImporting(true)
    setError(null)
    try {
      const inputs = buildInputs()
      await onImport(inputs)
      reset()
      setShowPreview(false)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.')
    } finally {
      setIsImporting(false)
    }
  }

  function managerLabelFor(id: string | null): string {
    if (!id) return 'Unassigned'
    return managers.find((m) => m.id === id)?.full_name || 'Unassigned'
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import students from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV export from your spreadsheet, map its columns to student fields, then
            import.
          </DialogDescription>
        </DialogHeader>

        {!fileName ? (
          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-6 py-10 text-center transition-colors hover:bg-muted/70"
            >
              <UploadCloud className="size-6 text-muted-foreground" />
              <p className="text-sm font-medium">Click to choose a CSV file</p>
              <p className="text-xs text-muted-foreground">
                The first row must contain column headers.
              </p>
            </button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="justify-self-center gap-1.5 text-muted-foreground"
              onClick={() => downloadCsvTemplate(isAdmin)}
            >
              <Download className="size-3.5" />
              Download CSV template
            </Button>
          </div>
        ) : !showPreview ? (
          <div className="grid gap-4">
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2">
              <div className="flex items-center gap-2 text-sm">
                <FileUp className="size-4 text-muted-foreground" />
                <span className="font-medium">{fileName}</span>
                <span className="text-muted-foreground">· {rows.length} rows</span>
              </div>
              <Button variant="ghost" size="sm" onClick={reset}>
                Change file
              </Button>
            </div>

            <div className="grid gap-3">
              <p className="text-xs font-medium text-muted-foreground">
                Map CSV columns to student fields
              </p>
              <div className="grid max-h-64 gap-2 overflow-y-auto pr-1">
                {headers.map((header) => (
                  <div key={header} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <span className="truncate text-sm" title={header}>
                      {header}
                    </span>
                    <span className="text-xs text-muted-foreground">→</span>
                    <Select
                      value={mapping[header] ?? NONE_VALUE}
                      onValueChange={(value) =>
                        setMapping((prev) => ({ ...prev, [header]: (value as string) ?? NONE_VALUE }))
                      }
                    >
                      <SelectTrigger size="sm">
                        <SelectValue placeholder="Skip column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value={NONE_VALUE}>Skip column</SelectItem>
                          {STUDENT_COLUMNS.map((c) => (
                            <SelectItem key={c.key} value={c.key}>
                              {c.label}
                            </SelectItem>
                          ))}
                          {isAdmin && (
                            <SelectItem value="manager_email">Manager email</SelectItem>
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {isAdmin ? (
              <div className="grid gap-2 rounded-md border border-border bg-muted/40 p-3">
                <Label className="text-xs font-medium text-muted-foreground">
                  Assign these students to a manager
                </Label>
                <Select
                  value={managerAssignment}
                  onValueChange={(v) => setManagerAssignment(v as string)}
                >
                  <SelectTrigger size="sm" className="w-full sm:w-64">
                    <SelectValue placeholder="Manager assignment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value={UNASSIGNED_MANAGER}>Leave unassigned</SelectItem>
                      <SelectItem value={EMAIL_COLUMN_MODE}>
                        Use &quot;Manager email&quot; column
                      </SelectItem>
                      {managers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          Assign all to {m.full_name || m.email}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {managerAssignment === EMAIL_COLUMN_MODE && (
                  <p className="text-xs text-muted-foreground">
                    Map a CSV column to &quot;Manager email&quot; above — rows whose email
                    doesn&apos;t match a manager account are imported unassigned.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                These students will be added to your own roster.
              </p>
            )}
          </div>
        ) : null}

        {showPreview && (
          <div className="grid gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              Preview — first {Math.min(5, buildInputs().length)} of {buildInputs().length} rows
            </p>
            <div className="max-h-48 overflow-auto rounded-md border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted/60 text-muted-foreground">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-medium">Name</th>
                    <th className="px-2 py-1.5 text-left font-medium">Start date</th>
                    {isAdmin && <th className="px-2 py-1.5 text-left font-medium">Manager</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {buildInputs()
                    .slice(0, 5)
                    .map((input, i) => (
                      <tr key={i}>
                        <td className="px-2 py-1.5">{input.name || '—'}</td>
                        <td className="px-2 py-1.5 font-mono">{input.start_date}</td>
                        {isAdmin && (
                          <td className="px-2 py-1.5">{managerLabelFor(input.manager_id)}</td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <DialogFooter>
          {showPreview ? (
            <>
              <Button variant="outline" onClick={() => setShowPreview(false)} disabled={isImporting}>
                Back to mapping
              </Button>
              <Button onClick={handleConfirmImport} disabled={isImporting}>
                {isImporting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  `Confirm import of ${buildInputs().length} students`
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
                Cancel
              </Button>
              <Button onClick={handleReviewImport} disabled={!fileName || isImporting}>
                Review import
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
