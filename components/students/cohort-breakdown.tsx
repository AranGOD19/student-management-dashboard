'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { Student } from '@/lib/students/types'
import { countBy } from '@/lib/students/derive'
import { formatDate } from '@/lib/students/format'

function BreakdownList({
  title,
  items,
  total,
}: {
  title: string
  items: { label: string; count: number }[]
  total: number
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-medium">{title}</h3>
      <div className="grid gap-2.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-sm text-muted-foreground" title={item.label}>
              {item.label}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${total > 0 ? (item.count / total) * 100 : 0}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-sm font-medium tabular-nums">
              {item.count}
            </span>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        )}
      </div>
    </div>
  )
}

export function CohortBreakdown({ students }: { students: Student[] }) {
  const byCohort = countBy(students, 'cohort')
  const byStatus = countBy(students, 'status')
  const byStartDate = countBy(students, 'start_date').map((item) => ({
    ...item,
    label: item.label === 'Unassigned' ? item.label : formatDate(item.label),
  }))

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <BreakdownList title="By cohort" items={byCohort} total={students.length} />
      <BreakdownList title="By start date" items={byStartDate} total={students.length} />
      <BreakdownList title="By status" items={byStatus} total={students.length} />
      <Link
        href="/students"
        className="col-span-full inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
      >
        View full students table
        <ArrowUpRight className="size-3.5" />
      </Link>
    </div>
  )
}
