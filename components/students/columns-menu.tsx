'use client'

import { Columns3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  DEFAULT_VISIBLE_COLUMNS,
  STUDENT_TABLE_COLUMNS,
  type StudentColumnKey,
} from '@/lib/students/column-visibility'

export function ColumnsMenu({
  visibleColumns,
  onVisibleColumnsChange,
  showManagerColumn,
}: {
  visibleColumns: Set<StudentColumnKey>
  onVisibleColumnsChange: (next: Set<StudentColumnKey>) => void
  /** Managers never see the Manager column, so don't offer it as a toggle. */
  showManagerColumn: boolean
}) {
  const columns = showManagerColumn
    ? STUDENT_TABLE_COLUMNS
    : STUDENT_TABLE_COLUMNS.filter((c) => c.key !== 'manager')

  function toggle(key: StudentColumnKey, checked: boolean) {
    const next = new Set(visibleColumns)
    if (checked) next.add(key)
    else next.delete(key)
    onVisibleColumnsChange(next)
  }

  function selectAll() {
    onVisibleColumnsChange(new Set(columns.map((c) => c.key)))
  }

  function resetToDefault() {
    const defaults = showManagerColumn
      ? DEFAULT_VISIBLE_COLUMNS
      : DEFAULT_VISIBLE_COLUMNS.filter((key) => key !== 'manager')
    onVisibleColumnsChange(new Set(defaults))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Columns3 className="size-4" />
            Columns
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-56">
        <div className="px-1.5 py-1 text-xs font-medium text-muted-foreground">
          Toggle columns
        </div>
        <div className="flex items-center gap-1 px-1.5 pb-1">
          <DropdownMenuItem
            closeOnClick={false}
            className="flex-1 justify-center text-xs"
            onClick={selectAll}
          >
            Select all
          </DropdownMenuItem>
          <DropdownMenuItem
            closeOnClick={false}
            className="flex-1 justify-center text-xs"
            onClick={resetToDefault}
          >
            Reset to default
          </DropdownMenuItem>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-64 overflow-y-auto">
          {columns.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.key}
              checked={visibleColumns.has(column.key)}
              onCheckedChange={(checked) => toggle(column.key, checked)}
            >
              {column.label}
            </DropdownMenuCheckboxItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
