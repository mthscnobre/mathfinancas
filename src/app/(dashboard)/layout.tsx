'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/lib/auth'
import { useTheme } from 'next-themes'
import { useHideValues } from '@/components/shared/AmountDisplay'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  MessageCircle,
  LogOut,
  TrendingUp,
  Landmark,
  RefreshCw,
  PieChart,
  Settings,
  Waves,
  Sun,
  Moon,
  Eye,
  EyeOff,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transacoes', label: 'Transações', icon: ArrowLeftRight },
  { href: '/recorrencias', label: 'Recorrências', icon: RefreshCw },
  { href: '/metas', label: 'Metas', icon: Target },
  { href: '/patrimonio', label: 'Patrimônio', icon: Landmark },
  { href: '/orcamentos', label: 'Orçamentos', icon: PieChart },
  { href: '/fluxo', label: 'Fluxo de Caixa', icon: Waves },
  { href: '/julius', label: 'Julius', icon: MessageCircle },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const { hidden, toggle } = useHideValues()

  const handleSignOut = async () => {
    await signOut()
    toast.success('Até logo!')
    router.push('/login')
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center gap-2 cursor-default">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary shrink-0">
                  <TrendingUp className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg">MathFinanças</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href}>
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={hidden ? 'Mostrar valores' : 'Ocultar valores'}
              onClick={toggle}
            >
              {hidden ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
              <span>{hidden ? 'Mostrar valores' : 'Ocultar valores'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
              <span>{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Sair" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
              <span className="text-muted-foreground">{user?.email}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="w-32 h-8" />
      </div>
    )
  }

  if (!user) return null

  return (
<SidebarProvider defaultOpen={false}>
  <AppSidebar />
  <main className="flex-1 overflow-auto">
    <div className="flex items-center gap-2 p-4 border-b">
      <SidebarTrigger />
    </div>
    {children}
  </main>
</SidebarProvider>
  )
}