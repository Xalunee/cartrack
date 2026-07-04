import { InstallBanner } from '@shared/ui/InstallBanner'
import { Sidebar, BottomNav, Header } from '@widgets/navigation'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-background">
      <InstallBanner />
      <div className="relative flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 pb-24 md:pb-0">
            {children}
          </main>
        </div>
        <BottomNav />
      </div>
    </div>
  )
}
