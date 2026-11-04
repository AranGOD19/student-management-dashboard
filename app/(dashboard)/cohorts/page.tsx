import { createClient } from '@/lib/supabase/server'
import { getStudents } from '@/lib/supabase/students'
import { AppHeader } from '@/components/app-shell/app-header'
import { CohortsList } from '@/components/students/cohorts-list'

export default async function CohortsPage() {
  const supabase = await createClient()
  const students = await getStudents(supabase)

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        title="Cohorts / Start Dates"
        description="Every intake grouped by start date, mirroring the original workbook tabs"
      />
      <div className="flex-1 p-4 md:p-6">
        <CohortsList students={students} />
      </div>
    </div>
  )
}
