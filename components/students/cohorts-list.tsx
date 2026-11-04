'use client'

import Link from 'next/link'
import { ArrowUpRight, Users } from 'lucide-react'
import type { Student } from '@/lib/students/types'
import { getStartDates } from '@/lib/students/derive'
import { formatDateLong } from '@/lib/students/format'
import { Badge } from '@/components/ui/badge'

export function CohortsList({ students }: { students: Student[] }) {
  const startDates = getStartDates(students)

  if (startDates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground">
        No start dates yet — add a student to see cohorts here.
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {startDates.map((date) => {
        const group = students.filter((s) => s.start_date === date)
        const cohortNames = Array.from(
          new Set(group.map((s) => s.cohort).filter((c): c is string => !!c)),
        )

        return (
          <Link
            key={date}
            href={`/students?start=${date}`}
            className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent/40 hover:bg-accent/5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{formatDateLong(date)}</span>
              <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-accent" />
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="size-3.5" />
              {group.length} student{group.length === 1 ? '' : 's'}
            </div>
            {cohortNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {cohortNames.map((name) => (
                  <Badge key={name} variant="outline" className="font-normal">
                    {name}
                  </Badge>
                ))}
              </div>
            )}
          </Link>
        )
      })}
    </div>
  )
}
