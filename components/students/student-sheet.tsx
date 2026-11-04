'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  EMPTY_STUDENT_INPUT,
  STATUS_OPTIONS,
  YES_NO_OPTIONS,
  type Student,
  type StudentInput,
} from '@/lib/students/types'
import type { Profile, UserRole } from '@/lib/supabase/profiles'
import { formatDateLong } from '@/lib/students/format'
import { cn } from '@/lib/utils'

type SheetMode = 'create' | 'view' | 'edit'

const UNASSIGNED_VALUE = '__unassigned__'

export function StudentSheet({
  open,
  mode,
  student,
  role,
  managers,
  onOpenChange,
  onCreate,
  onUpdate,
  onDelete,
}: {
  open: boolean
  mode: SheetMode
  student: Student | null
  role: UserRole
  /** Admin only — used to populate the Manager select. */
  managers: Profile[]
  onOpenChange: (open: boolean) => void
  onCreate: (input: StudentInput) => Promise<void>
  onUpdate: (id: string, input: StudentInput) => Promise<void>
  onDelete: (student: Student) => void
}) {
  const [internalMode, setInternalMode] = useState<SheetMode>(mode)
  const [form, setForm] = useState<StudentInput>(EMPTY_STUDENT_INPUT)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setInternalMode(mode)
    setFormError(null)
    setForm(
      student
        ? {
            start_date: student.start_date,
            cohort: student.cohort ?? '',
            name: student.name ?? '',
            payment_email: student.payment_email ?? '',
            platform_email: student.platform_email ?? '',
            discord_name: student.discord_name ?? '',
            phone: student.phone ?? '',
            script: student.script ?? '',
            status: student.status ?? '',
            course: student.course ?? '',
            sub_activated_1: student.sub_activated_1 ?? '',
            sub_activated_2: student.sub_activated_2 ?? '',
            s0_started: student.s0_started ?? '',
            s1_started: student.s1_started ?? '',
            can_move: student.can_move ?? '',
            hubspot_link: student.hubspot_link ?? '',
            hilos_product_link: student.hilos_product_link ?? '',
            lms_profile_link: student.lms_profile_link ?? '',
            notes: student.notes ?? '',
            manager_id: student.manager_id,
          }
        : EMPTY_STUDENT_INPUT,
    )
  }, [open, mode, student])

  function updateField<K extends keyof StudentInput>(key: K, value: StudentInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!form.name?.trim()) {
      setFormError('Name is required.')
      return
    }
    if (!form.start_date) {
      setFormError('Start date is required.')
      return
    }
    setFormError(null)
    setIsSaving(true)
    try {
      if (internalMode === 'create') {
        await onCreate(form)
      } else if (student) {
        await onUpdate(student.id, form)
        setInternalMode('view')
      }
      if (internalMode === 'create') {
        onOpenChange(false)
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsSaving(false)
    }
  }

  const isFormMode = internalMode === 'create' || internalMode === 'edit'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle>
            {internalMode === 'create'
              ? 'Add student'
              : internalMode === 'edit'
                ? `Edit ${student?.name || 'student'}`
                : student?.name || 'Student details'}
          </SheetTitle>
          <SheetDescription>
            {internalMode === 'create'
              ? 'Create a new student record in the students table.'
              : internalMode === 'edit'
                ? 'Update this student record.'
                : student
                  ? `Started ${formatDateLong(student.start_date)}`
                  : ''}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isFormMode ? (
            <StudentForm form={form} onChange={updateField} role={role} managers={managers} />
          ) : student ? (
            <StudentReadOnlyView student={student} role={role} />
          ) : null}
          {formError && (
            <p className="mt-4 text-sm text-destructive" role="alert">
              {formError}
            </p>
          )}
        </div>

        <SheetFooter className="border-t border-border px-6 py-4">
          {isFormMode ? (
            <div className="flex w-full items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  internalMode === 'edit' && student
                    ? setInternalMode('view')
                    : onOpenChange(false)
                }
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          ) : (
            <div className="flex w-full items-center justify-between gap-2">
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => student && onDelete(student)}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
              <div className="flex items-center gap-2">
                <SheetClose render={<Button variant="outline">Close</Button>} />
                <Button onClick={() => setInternalMode('edit')}>
                  <Pencil className="size-4" />
                  Edit
                </Button>
              </div>
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function StudentForm({
  form,
  onChange,
  role,
  managers,
}: {
  form: StudentInput
  onChange: <K extends keyof StudentInput>(key: K, value: StudentInput[K]) => void
  role: UserRole
  managers: Profile[]
}) {
  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Start date">
          <Input
            type="date"
            value={form.start_date}
            onChange={(e) => onChange('start_date', e.target.value)}
            required
          />
        </Field>
        <Field label="Cohort">
          <Input
            value={form.cohort ?? ''}
            onChange={(e) => onChange('cohort', e.target.value)}
            placeholder="e.g. Fall Cohort A"
          />
        </Field>
      </div>

      <Field label="Name">
        <Input
          value={form.name ?? ''}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="Full name"
          required
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Payment email">
          <Input
            type="email"
            value={form.payment_email ?? ''}
            onChange={(e) => onChange('payment_email', e.target.value)}
            placeholder="billing@example.com"
          />
        </Field>
        <Field label="Platform email (LMS)">
          <Input
            type="email"
            value={form.platform_email ?? ''}
            onChange={(e) => onChange('platform_email', e.target.value)}
            placeholder="student@example.com"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Discord name">
          <Input
            value={form.discord_name ?? ''}
            onChange={(e) => onChange('discord_name', e.target.value)}
          />
        </Field>
        <Field label="Phone">
          <Input
            type="tel"
            value={form.phone ?? ''}
            onChange={(e) => onChange('phone', e.target.value)}
          />
        </Field>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Script">
          <Input
            value={form.script ?? ''}
            onChange={(e) => onChange('script', e.target.value)}
          />
        </Field>
        <Field label="Course">
          <Input
            value={form.course ?? ''}
            onChange={(e) => onChange('course', e.target.value)}
          />
        </Field>
      </div>

      <Field label="Status">
        <PlainSelect
          value={form.status ?? ''}
          options={STATUS_OPTIONS}
          onChange={(v) => onChange('status', v)}
          placeholder="Select status"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Sub activated 1">
          <PlainSelect
            value={form.sub_activated_1 ?? ''}
            options={YES_NO_OPTIONS}
            onChange={(v) => onChange('sub_activated_1', v)}
            placeholder="Select"
          />
        </Field>
        <Field label="Sub activated 2">
          <PlainSelect
            value={form.sub_activated_2 ?? ''}
            options={YES_NO_OPTIONS}
            onChange={(v) => onChange('sub_activated_2', v)}
            placeholder="Select"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="S0 started">
          <PlainSelect
            value={form.s0_started ?? ''}
            options={YES_NO_OPTIONS}
            onChange={(v) => onChange('s0_started', v)}
            placeholder="Select"
          />
        </Field>
        <Field label="S1 started">
          <PlainSelect
            value={form.s1_started ?? ''}
            options={YES_NO_OPTIONS}
            onChange={(v) => onChange('s1_started', v)}
            placeholder="Select"
          />
        </Field>
      </div>

      <Field label="Can move?">
        <PlainSelect
          value={form.can_move ?? ''}
          options={YES_NO_OPTIONS}
          onChange={(v) => onChange('can_move', v)}
          placeholder="Select"
        />
      </Field>

      {role === 'admin' && (
        <Field label="Manager">
          <Select
            value={form.manager_id ?? UNASSIGNED_VALUE}
            onValueChange={(v) =>
              onChange('manager_id', v === UNASSIGNED_VALUE ? null : (v as string))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select manager" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
                {managers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.full_name || m.email || 'Manager'}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      )}

      <Separator />

      <Field label="Link to HubSpot">
        <Input
          type="url"
          value={form.hubspot_link ?? ''}
          onChange={(e) => onChange('hubspot_link', e.target.value)}
          placeholder="https://app.hubspot.com/..."
        />
      </Field>
      <Field label="Link Hilos product">
        <Input
          type="url"
          value={form.hilos_product_link ?? ''}
          onChange={(e) => onChange('hilos_product_link', e.target.value)}
          placeholder="https://..."
        />
      </Field>
      <Field label="Link to a profile (LMS)">
        <Input
          type="url"
          value={form.lms_profile_link ?? ''}
          onChange={(e) => onChange('lms_profile_link', e.target.value)}
          placeholder="https://..."
        />
      </Field>

      <Field label="Notes">
        <Textarea
          value={form.notes ?? ''}
          onChange={(e) => onChange('notes', e.target.value)}
          rows={4}
          placeholder="Internal notes about this student..."
        />
      </Field>
    </div>
  )
}

/** Dropdown-only select for enum-like fields (Status, Can Move?, the
 * activity YES/NO fields). Deliberately has no free-text input and no
 * "suggest" affordance — the value must be one of `options`. */
function PlainSelect({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: string
  options: readonly string[]
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange((v as string) ?? '')}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder ?? 'Select'} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words font-medium">{value || '—'}</span>
    </div>
  )
}

function DetailLink({ label, href }: { label: string; href: string | null }) {
  const url = href ? (/^https?:\/\//i.test(href) ? href : `https://${href}`) : null
  return (
    <div className="grid grid-cols-[130px_1fr] items-center gap-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-accent hover:underline"
        >
          Open
          <ExternalLink className="size-3.5" />
        </a>
      ) : (
        <span className="text-muted-foreground">—</span>
      )}
    </div>
  )
}

function StudentReadOnlyView({ student, role }: { student: Student; role: UserRole }) {
  return (
    <div className="divide-y divide-border">
      <div className="pb-3">
        <DetailRow label="Name" value={student.name} />
        <DetailRow label="Start date" value={formatDateLong(student.start_date)} />
        <DetailRow label="Cohort" value={student.cohort} />
        {role === 'admin' && (
          <DetailRow
            label="Manager"
            value={student.manager?.full_name || student.manager?.email || 'Unassigned'}
          />
        )}
        <DetailRow
          label="Status"
          value={
            student.status ? (
              <Badge variant="outline" className={cn('font-normal')}>
                {student.status}
              </Badge>
            ) : null
          }
        />
      </div>
      <div className="py-3">
        <DetailRow label="Payment email" value={student.payment_email} />
        <DetailRow label="Platform email" value={student.platform_email} />
        <DetailRow label="Discord name" value={student.discord_name} />
        <DetailRow label="Phone" value={student.phone} />
      </div>
      <div className="py-3">
        <DetailRow label="Script" value={student.script} />
        <DetailRow label="Course" value={student.course} />
        <DetailRow label="Sub activated 1" value={student.sub_activated_1} />
        <DetailRow label="Sub activated 2" value={student.sub_activated_2} />
        <DetailRow label="S0 started" value={student.s0_started} />
        <DetailRow label="S1 started" value={student.s1_started} />
        <DetailRow label="Can move" value={student.can_move} />
      </div>
      <div className="py-3">
        <DetailLink label="HubSpot" href={student.hubspot_link} />
        <DetailLink label="Hilos product" href={student.hilos_product_link} />
        <DetailLink label="LMS profile" href={student.lms_profile_link} />
      </div>
      {student.notes && (
        <div className="py-3">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Notes
          </span>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{student.notes}</p>
        </div>
      )}
    </div>
  )
}
