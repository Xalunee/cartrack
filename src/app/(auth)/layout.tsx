import { AuthBackground } from '@shared/ui'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background relative min-h-screen overflow-x-hidden">
      <AuthBackground />
      <div className="relative">{children}</div>
    </div>
  )
}
