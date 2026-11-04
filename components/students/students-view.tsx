'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
  bulkCreateStudents,
  createStudent,
  deleteStudent,
  updateStudent,
  updateStudentField,
} from '@/lib/supabase/students'
import type { Profile, UserRole } from '@/lib/supabase/profiles'
import type { Student, StudentInput } from '@/lib/students/types'
import {
  EMPTY_FILTERS,
  filterStudents,
  getCohorts,
  getCourses,
  getStartDates,
  getStatuses,
  type StudentFilters,
} from '@/lib/students/derive'
import {
  DEFAULT_VISIBLE_COLUMNS,
  loadVisibleColumns,
  saveVisibleColumns,
  type StudentColumnKey,
} from '@/lib/students/column-visibility'
import { formatDate } from '@/lib/students/format'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { StudentsStats } from '@/components/students/students-stats'
import { StudentsToolbar } from '@/components/students/students-toolbar'
import { StudentsTable } from '@/components/students/students-table'
import { StudentSheet } from '@/components/students/student-sheet'
import { ImportCsvDialog } from '@/components/students/import-csv-dialog'

type SheetState =
  | { open: false }
  | { open: true; mode: 'create' }
  | { open: true; mode: 'view' | 'edit'; student: Student }

export function StudentsView({
  initialStudents,
  initialTab,
  role,
  currentUserId,
  managers,
}: {
  initialStudents: Student[]
  initialTab?: string
  role: UserRole
  currentUserId: string
  /** Admin only — the pool of manager profiles selectable in forms/filters. */
  managers: Profile[]
}) {
  const supabase = useMemo(() => createClient(), [])
  const isAdmin = role === 'admin'
  const [students, setStudents] = useState<Student[]>(initialStudents)
  const [activeTab, setActiveTab] = useState(initialTab || 'general')
  const [filters, setFilters] = useState<StudentFilters>(EMPTY_FILTERS)
  const [sheetState, setSheetState] = useState<SheetState>({ open: false })
  const [importOpen, setImportOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null)

  // Column visibility is per-user, persisted in localStorage. The initial
  // render always uses "every column visible" so it matches the
  // server-rendered markup exactly (no hydration mismatch); the saved
  // preference — if any — is applied right after mount.
  const [visibleColumns, setVisibleColumnsState] = useState<Set<StudentColumnKey>>(
    () => new Set(DEFAULT_VISIBLE_COLUMNS),
  )
  useEffect(() => {
    setVisibleColumnsState(loadVisibleColumns(currentUserId))
  }, [currentUserId])

  function setVisibleColumns(next: Set<StudentColumnKey>) {
    setVisibleColumnsState(next)
    saveVisibleColumns(currentUserId, next)
  }

  const startDates = useMemo(() => getStartDates(students), [students])
  const cohorts = useMemo(() => getCohorts(students), [students])
  const statuses = useMemo(() => getStatuses(students), [students])
  const courses = useMemo(() => getCourses(students), [students])

  const tabScoped = useMemo(() => {
    if (activeTab === 'general') return students
    return students.filter((s) => s.start_date === activeTab)
  }, [students, activeTab])

  const visibleStudents = useMemo(
    () => filterStudents(tabScoped, filters),
    [tabScoped, filters],
  )

  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.cohort !== 'all' ||
    filters.status !== 'all' ||
    filters.course !== 'all' ||
    filters.manager !== 'all'

  async function handleCreate(input: StudentInput) {
    // Managers may only ever create students assigned to themselves — the
    // manager field is hidden from them in the form, so enforce it here too.
    const payload = isAdmin ? input : { ...input, manager_id: currentUserId }
    const created = await createStudent(supabase, payload)
    setStudents((prev) => [...prev, created])
    toast.success('Student added')
  }

  async function handleUpdate(id: string, input: StudentInput) {
    const payload = isAdmin ? input : { ...input, manager_id: currentUserId }
    const updated = await updateStudent(supabase, id, payload)
    setStudents((prev) => prev.map((s) => (s.id === id ? updated : s)))
    setSheetState({ open: true, mode: 'view', student: updated })
    toast.success('Student updated')
  }

  async function handleFieldSave(student: Student, field: keyof StudentInput, value: string) {
    try {
      const updated = await updateStudentField(supabase, student.id, field, value)
      setStudents((prev) => prev.map((s) => (s.id === student.id ? updated : s)))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save — reverted.')
      throw err
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return
    const target = deleteTarget
    setDeleteTarget(null)
    try {
      await deleteStudent(supabase, target.id)
      setStudents((prev) => prev.filter((s) => s.id !== target.id))
      if (sheetState.open && 'student' in sheetState && sheetState.student.id === target.id) {
        setSheetState({ open: false })
      }
      toast.success(`Removed ${target.name || 'student'}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete student')
    }
  }

  async function handleImport(inputs: StudentInput[]) {
    // Managers may only ever import students into their own roster — the
    // manager-assignment picker is hidden from them in the dialog, so
    // enforce it here too, same as create/update.
    const payload = isAdmin
      ? inputs
      : inputs.map((input) => ({ ...input, manager_id: currentUserId }))
    const created = await bulkCreateStudents(supabase, payload)
    setStudents((prev) => [...prev, ...created])
    toast.success(`Imported ${created.length} student${created.length === 1 ? '' : 's'}`)
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <StudentsStats students={students} />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as string)}>
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="general">GENERAL</TabsTrigger>
          {startDates.map((date) => (
            <TabsTrigger key={date} value={date}>
              {formatDate(date)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <StudentsToolbar
        filters={filters}
        onFiltersChange={setFilters}
        cohorts={cohorts}
        statuses={statuses}
        courses={courses}
        managers={isAdmin ? managers : undefined}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={setVisibleColumns}
        showManagerColumn={isAdmin}
        onAddStudent={() => setSheetState({ open: true, mode: 'create' })}
        onImport={() => setImportOpen(true)}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={() => setFilters(EMPTY_FILTERS)}
      />

      <StudentsTable
        students={visibleStudents}
        showManagerColumn={isAdmin}
        visibleColumns={visibleColumns}
        onRowClick={(student) => setSheetState({ open: true, mode: 'view', student })}
        onEdit={(student) => setSheetState({ open: true, mode: 'edit', student })}
        onDelete={(student) => setDeleteTarget(student)}
        onFieldSave={handleFieldSave}
      />

      <StudentSheet
        open={sheetState.open}
        mode={sheetState.open ? sheetState.mode : 'view'}
        student={sheetState.open && 'student' in sheetState ? sheetState.student : null}
        role={role}
        managers={managers}
        onOpenChange={(open) => {
          if (!open) setSheetState({ open: false })
        }}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={(student) => setDeleteTarget(student)}
      />

      <ImportCsvDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImport}
        role={role}
        managers={isAdmin ? managers : []}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name || 'this student'}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the student record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDeleteConfirmed}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
