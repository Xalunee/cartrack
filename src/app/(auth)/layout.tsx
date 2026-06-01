export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Gradient mesh background */}
      <div className="fixed inset-0 z-0 pointer-events-none gradient-mesh-auth" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
