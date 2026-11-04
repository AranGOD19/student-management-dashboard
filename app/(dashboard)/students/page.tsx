import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudents } from '@/lib/supabase/students'
import { getCurrentProfile, getManagers } from '@/lib/supabase/profiles'
import { StudentsView } from '@/components/students/students-view'
import { AppHeader } from '@/components/app-shell/app-header'

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>
}) {
  const supabase = await createClient()
  const profile = await getCurrentProfile(supabase)
  if (!profile) redirect('/auth/login')

  // RLS already scopes getStudents() to the caller's own rows for managers,
  // so this is always exactly what the current user is allowed to see.
  const students = await getStudents(supabase)
  const managers = profile.role === 'admin' ? await getManagers(supabase) : []
  const { start } = await searchParams

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <AppHeader title="Students" description="All student records in one place" />
      <div className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-6">
        <StudentsView
          initialStudents={students}
          initialTab={start}
          role={profile.role}
          currentUserId={profile.id}
          managers={managers}
        />
      </div>
    </div>
  )
}
