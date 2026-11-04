'use client'

import { useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/supabase/profiles'

export function UserMenu({
  userEmail,
  role,
}: {
  userEmail: string | null
  role: UserRole
}) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg">
                <Avatar className="size-6 rounded-md">
                  <AvatarFallback className="rounded-md bg-sidebar-accent text-sidebar-accent-foreground">
                    <User className="size-3.5" />
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-sm">{userEmail ?? 'Account'}</span>
                <Badge
                  variant="outline"
                  className="ml-auto shrink-0 border-sidebar-border px-1.5 py-0 text-[10px] font-normal text-sidebar-foreground capitalize"
                >
                  {role}
                </Badge>
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {userEmail}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
