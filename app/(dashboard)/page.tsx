import Link from 'next/link'
import { ArrowUpRight, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getStudents } from '@/lib/supabase/students'
import { AppHeader } from '@/components/app-shell/app-header'
import { StudentsStats } from '@/components/students/students-stats'
import { CohortBreakdown } from '@/components/students/cohort-breakdown'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const students = await getStudents(supabase)

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Dashboard" description="Overview of every student in the pipeline">
        <Button
          size="sm"
          nativeButton={false}
          render={
            <Link href="/students">
              Go to students
              <ArrowUpRight className="size-4" data-icon="inline-end" />
            </Link>
          }
        />
      </AppHeader>
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <StudentsStats students={students} />

        {students.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
            <Upload className="size-6 text-muted-foreground" />
            <div>
              <p className="font-medium">No students yet</p>
              <p className="text-sm text-muted-foreground">
                Add your first student or import a CSV from the Students page.
              </p>
            </div>
            <Button
              size="sm"
              className="mt-2"
              nativeButton={false}
              render={<Link href="/students">Go to students</Link>}
            />
          </div>
        ) : (
          <CohortBreakdown students={students} />
        )}
      </div>
    </div>
  )
}
