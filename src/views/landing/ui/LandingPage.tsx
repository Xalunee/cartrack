import Link from 'next/link'
import { Button } from '@shared/ui'
import { APP_CONFIG } from '@shared/config'

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center">
      <h1 className="text-4xl font-bold">{APP_CONFIG.name}</h1>
      <p className="text-muted-foreground max-w-sm">{APP_CONFIG.description}</p>
      <Link href="/login"><Button size="lg">Войти</Button></Link>
    </div>
  )
}
