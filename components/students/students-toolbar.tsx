'use client'

import { Plus, Search, Upload, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { StudentFilters } from '@/lib/students/derive'
import type { Profile } from '@/lib/supabase/profiles'
import { ColumnsMenu } from '@/components/students/columns-menu'
import type { StudentColumnKey } from '@/lib/students/column-visibility'

export function StudentsToolbar({
  filters,
  onFiltersChange,
  cohorts,
  statuses,
  courses,
  managers,
  visibleColumns,
  onVisibleColumnsChange,
  showManagerColumn,
  onAddStudent,
  onImport,
  hasActiveFilters,
  onClearFilters,
}: {
  filters: StudentFilters
  onFiltersChange: (filters: StudentFilters) => void
  cohorts: string[]
  statuses: string[]
  courses: string[]
  /** Admin only. When omitted, the manager filter is hidden entirely — a
   * manager should never see an "All Managers" selector. */
  managers?: Profile[]
  visibleColumns: Set<StudentColumnKey>
  onVisibleColumnsChange: (next: Set<StudentColumnKey>) => void
  showManagerColumn: boolean
  onAddStudent: () => void
  onImport: () => void
  hasActiveFilters: boolean
  onClearFilters: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full max-w-xs sm:w-64">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          placeholder="Search name, email, discord, phone..."
          className="pl-8"
        />
      </div>

      {managers && (
        <Select
          value={filters.manager}
          onValueChange={(v) => onFiltersChange({ ...filters, manager: (v as string) ?? 'all' })}
        >
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="Manager" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All managers</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {managers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.full_name || m.email || 'Manager'}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}

      <FilterSelect
        placeholder="Cohort"
        value={filters.cohort}
        options={cohorts}
        onChange={(v) => onFiltersChange({ ...filters, cohort: v })}
      />
      <FilterSelect
        placeholder="Status"
        value={filters.status}
        options={statuses}
        onChange={(v) => onFiltersChange({ ...filters, status: v })}
      />
      <FilterSelect
        placeholder="Course"
        value={filters.course}
        options={courses}
        onChange={(v) => onFiltersChange({ ...filters, course: v })}
      />

      <ColumnsMenu
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={onVisibleColumnsChange}
        showManagerColumn={showManagerColumn}
      />

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="gap-1 text-muted-foreground">
          <X className="size-3.5" />
          Clear filters
        </Button>
      )}

      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onImport} className="gap-1.5">
          <Upload className="size-4" />
          Import CSV
        </Button>
        <Button size="sm" onClick={onAddStudent} className="gap-1.5">
          <Plus className="size-4" />
          Add Student
        </Button>
      </div>
    </div>
  )
}

function FilterSelect({
  placeholder,
  value,
  options,
  onChange,
}: {
  placeholder: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange((v as string) ?? 'all')}>
      <SelectTrigger size="sm" className="w-36">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="all">All {placeholder.toLowerCase()}s</SelectItem>
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
