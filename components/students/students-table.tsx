'use client'

import { ExternalLink, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Student, StudentInput } from '@/lib/students/types'
import { formatDate } from '@/lib/students/format'
import { InlineStatusSelect, InlineYesNoSelect } from '@/components/students/inline-select'
import type { StudentColumnKey } from '@/lib/students/column-visibility'

function LinkCell({ href }: { href: string | null }) {
  if (!href) return <span className="text-muted-foreground">—</span>
  const url = /^https?:\/\//i.test(href) ? href : `https://${href}`
  return (
    <Button
      variant="outline"
      size="sm"
      nativeButton={false}
      className="h-7 gap-1 px-2 text-xs"
      onClick={(e) => e.stopPropagation()}
      render={
        <a href={url} target="_blank" rel="noopener noreferrer">
          Open
          <ExternalLink className="size-3" data-icon="inline-end" />
        </a>
      }
    />
  )
}

function TextCell({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>
  return <span className="max-w-[220px] truncate">{value}</span>
}

export function StudentsTable({
  students,
  showManagerColumn,
  visibleColumns,
  onRowClick,
  onEdit,
  onDelete,
  onFieldSave,
}: {
  students: Student[]
  showManagerColumn: boolean
  visibleColumns: Set<StudentColumnKey>
  onRowClick: (student: Student) => void
  onEdit: (student: Student) => void
  onDelete: (student: Student) => void
  onFieldSave: (student: Student, field: keyof StudentInput, value: string) => Promise<void>
}) {
  const show = (key: StudentColumnKey) => visibleColumns.has(key)
  const showStartDate = show('start_date')
  const showName = show('name')

  // Start Date and Name are the only two sticky-left columns. Name's offset
  // only depends on whether Start Date (the one column to its left) is
  // shown — Cohort sits between them but never sticks, so it never affects
  // this math.
  const nameStickyClass = showStartDate ? 'left-[104px]' : 'left-0'

  const visibleCount =
    ['start_date', 'cohort', 'name', 'payment_email', 'platform_email', 'discord_name', 'phone', 'script', 'status', 'course', 'sub_activated_1', 'sub_activated_2', 's0_started', 's1_started', 'can_move', 'hubspot_link', 'hilos_product_link', 'lms_profile_link', 'notes'].filter(
      show,
    ).length +
    (showManagerColumn && show('manager') ? 1 : 0)
  const columnCount = visibleCount + 1 // + row-actions column, always shown

  return (
    <div className="relative isolate max-h-[calc(100vh-15rem)] overflow-auto rounded-lg border border-border bg-card">
      <Table className="text-sm">
        <TableHeader className="sticky top-0 z-20 bg-card shadow-[0_1px_0_0_var(--border)]">
          <TableRow>
            {showStartDate && (
              <TableHead className="sticky left-0 z-30 min-w-[104px] bg-card">
                Start Date
              </TableHead>
            )}
            {show('cohort') && <TableHead className="min-w-[120px]">Cohort</TableHead>}
            {showName && (
              <TableHead
                className={`sticky ${nameStickyClass} z-30 min-w-[170px] bg-card shadow-[1px_0_0_0_var(--border)]`}
              >
                Name
              </TableHead>
            )}
            {showManagerColumn && show('manager') && (
              <TableHead className="min-w-[150px]">Manager</TableHead>
            )}
            {show('payment_email') && (
              <TableHead className="min-w-[200px]">Payment Email</TableHead>
            )}
            {show('platform_email') && (
              <TableHead className="min-w-[200px]">Platform Email (LMS)</TableHead>
            )}
            {show('discord_name') && (
              <TableHead className="min-w-[150px]">Discord Name</TableHead>
            )}
            {show('phone') && <TableHead className="min-w-[130px]">Phone</TableHead>}
            {show('script') && <TableHead className="min-w-[130px]">Script</TableHead>}
            {show('status') && <TableHead className="min-w-[140px]">Status</TableHead>}
            {show('course') && <TableHead className="min-w-[130px]">Course</TableHead>}
            {show('sub_activated_1') && (
              <TableHead className="min-w-[140px]">Sub Activated 1</TableHead>
            )}
            {show('sub_activated_2') && (
              <TableHead className="min-w-[140px]">Sub Activated 2</TableHead>
            )}
            {show('s0_started') && <TableHead className="min-w-[120px]">S0 Started</TableHead>}
            {show('s1_started') && <TableHead className="min-w-[120px]">S1 Started</TableHead>}
            {show('can_move') && <TableHead className="min-w-[110px]">Can Move?</TableHead>}
            {show('hubspot_link') && <TableHead className="min-w-[110px]">HubSpot</TableHead>}
            {show('hilos_product_link') && (
              <TableHead className="min-w-[130px]">Hilos Product</TableHead>
            )}
            {show('lms_profile_link') && (
              <TableHead className="min-w-[130px]">LMS Profile</TableHead>
            )}
            {show('notes') && <TableHead className="min-w-[220px]">Notes</TableHead>}
            <TableHead className="sticky right-0 z-30 w-[56px] bg-card text-right shadow-[-1px_0_0_0_var(--border)]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.length === 0 && (
            <TableRow>
              <TableCell colSpan={columnCount} className="h-32 text-center text-muted-foreground">
                No students match the current filters.
              </TableCell>
            </TableRow>
          )}
          {students.map((student) => (
            <TableRow
              key={student.id}
              className="cursor-pointer"
              onClick={() => onRowClick(student)}
            >
              {showStartDate && (
                <TableCell className="sticky left-0 z-10 bg-card font-mono text-xs tabular-nums">
                  {formatDate(student.start_date)}
                </TableCell>
              )}
              {show('cohort') && (
                <TableCell>
                  <TextCell value={student.cohort} />
                </TableCell>
              )}
              {showName && (
                <TableCell
                  className={`sticky ${nameStickyClass} z-10 bg-card font-medium shadow-[1px_0_0_0_var(--border)]`}
                >
                  <TextCell value={student.name} />
                </TableCell>
              )}
              {showManagerColumn && show('manager') && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <TextCell value={student.manager?.full_name ?? student.manager?.email ?? null} />
                </TableCell>
              )}
              {show('payment_email') && (
                <TableCell>
                  <TextCell value={student.payment_email} />
                </TableCell>
              )}
              {show('platform_email') && (
                <TableCell>
                  <TextCell value={student.platform_email} />
                </TableCell>
              )}
              {show('discord_name') && (
                <TableCell>
                  <TextCell value={student.discord_name} />
                </TableCell>
              )}
              {show('phone') && (
                <TableCell>
                  <TextCell value={student.phone} />
                </TableCell>
              )}
              {show('script') && (
                <TableCell>
                  <TextCell value={student.script} />
                </TableCell>
              )}
              {show('status') && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <InlineStatusSelect
                    value={student.status}
                    onSave={(next) => onFieldSave(student, 'status', next)}
                  />
                </TableCell>
              )}
              {show('course') && (
                <TableCell>
                  <TextCell value={student.course} />
                </TableCell>
              )}
              {show('sub_activated_1') && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <InlineYesNoSelect
                    value={student.sub_activated_1}
                    onSave={(next) => onFieldSave(student, 'sub_activated_1', next)}
                  />
                </TableCell>
              )}
              {show('sub_activated_2') && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <InlineYesNoSelect
                    value={student.sub_activated_2}
                    onSave={(next) => onFieldSave(student, 'sub_activated_2', next)}
                  />
                </TableCell>
              )}
              {show('s0_started') && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <InlineYesNoSelect
                    value={student.s0_started}
                    onSave={(next) => onFieldSave(student, 's0_started', next)}
                  />
                </TableCell>
              )}
              {show('s1_started') && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <InlineYesNoSelect
                    value={student.s1_started}
                    onSave={(next) => onFieldSave(student, 's1_started', next)}
                  />
                </TableCell>
              )}
              {show('can_move') && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <InlineYesNoSelect
                    value={student.can_move}
                    onSave={(next) => onFieldSave(student, 'can_move', next)}
                  />
                </TableCell>
              )}
              {show('hubspot_link') && (
                <TableCell>
                  <LinkCell href={student.hubspot_link} />
                </TableCell>
              )}
              {show('hilos_product_link') && (
                <TableCell>
                  <LinkCell href={student.hilos_product_link} />
                </TableCell>
              )}
              {show('lms_profile_link') && (
                <TableCell>
                  <LinkCell href={student.lms_profile_link} />
                </TableCell>
              )}
              {show('notes') && (
                <TableCell>
                  <TextCell value={student.notes} />
                </TableCell>
              )}
              <TableCell
                className="sticky right-0 z-10 bg-card text-right shadow-[-1px_0_0_0_var(--border)]"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon" className="size-7">
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Row actions</span>
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(student)}>
                      <Pencil className="size-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onDelete(student)}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
