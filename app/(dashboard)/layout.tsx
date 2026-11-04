import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-shell/app-sidebar'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/profiles'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const profile = user ? await getCurrentProfile(supabase) : null

  return (
    <SidebarProvider>
      <AppSidebar
        userEmail={user?.email ?? null}
        role={profile?.role ?? 'manager'}
      />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
