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
          {/* Clears the bottom bar, which is 3.5rem plus whatever the home indicator
              takes — the same shape as the header's top-inset height. Hidden from md
              up, so the padding goes with it. */}
          <main className="flex-1 pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
            {children}
          </main>
        </div>
        <BottomNav />
      </div>
    </div>
  )
}
