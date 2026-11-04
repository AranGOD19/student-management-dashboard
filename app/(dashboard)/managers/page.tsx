import { redirect } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile, getManagers } from '@/lib/supabase/profiles'
import { getStudents } from '@/lib/supabase/students'
import { AppHeader } from '@/components/app-shell/app-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default async function ManagersPage() {
  const supabase = await createClient()
  const profile = await getCurrentProfile(supabase)
  if (!profile) redirect('/auth/login')
  // Server-side guard — this is the actual boundary. The sidebar just hides
  // the link; a manager hitting this URL directly still gets bounced here.
  if (profile.role !== 'admin') redirect('/')

  const [managers, students] = await Promise.all([getManagers(supabase), getStudents(supabase)])

  const assignedCounts = new Map<string, number>()
  for (const student of students) {
    if (!student.manager_id) continue
    assignedCounts.set(student.manager_id, (assignedCounts.get(student.manager_id) ?? 0) + 1)
  }
  const unassignedCount = students.filter((s) => !s.manager_id).length

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        title="Managers"
        description="Everyone with manager access, and how many students each one owns"
      />
      <div className="flex-1 space-y-4 p-4 md:p-6">
        <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-sm">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-muted-foreground">
            New managers create their own account from the sign-up page — every new sign-up is a
            manager automatically. Assign them students from a student&apos;s edit form or the CSV
            importer.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table className="text-sm">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Assigned students</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {managers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                    No managers yet — invite your team to sign up.
                  </TableCell>
                </TableRow>
              )}
              {managers.map((manager) => (
                <TableRow key={manager.id}>
                  <TableCell className="font-medium">{manager.full_name || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{manager.email}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="font-normal">
                      {assignedCounts.get(manager.id) ?? 0}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {unassignedCount > 0 && (
                <TableRow>
                  <TableCell className="font-medium text-muted-foreground">Unassigned</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="font-normal">
                      {unassignedCount}
                    </Badge>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
