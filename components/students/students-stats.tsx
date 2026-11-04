'use client'

import { CalendarClock, CheckCircle2, ListChecks, Users } from 'lucide-react'
import type { Student } from '@/lib/students/types'
import { getDashboardStats } from '@/lib/students/derive'
import { cn } from '@/lib/utils'

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  tone: 'default' | 'accent' | 'warning' | 'chart2'
}) {
  const toneClasses: Record<typeof tone, string> = {
    default: 'bg-secondary text-secondary-foreground',
    accent: 'bg-accent/15 text-accent',
    warning: 'bg-warning/15 text-warning',
    chart2: 'bg-chart-2/15 text-chart-2',
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-md', toneClasses[tone])}>
        <Icon className="size-4.5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-semibold tabular-nums leading-none">{value}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

export function StudentsStats({ students }: { students: Student[] }) {
  const stats = getDashboardStats(students)

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Total students" value={stats.total} icon={Users} tone="default" />
      <StatCard label="Starting soon" value={stats.startingSoon} icon={CalendarClock} tone="chart2" />
      <StatCard label="Ready to start" value={stats.readyToStart} icon={ListChecks} tone="accent" />
      <StatCard label="Set up" value={stats.setUp} icon={CheckCircle2} tone="warning" />
    </div>
  )
}
