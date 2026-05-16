import { APP_CONFIG } from '@shared/config'

export function Header() {
  return (
    <header className="border-b px-4 py-3">
      <h1 className="text-lg font-semibold">{APP_CONFIG.name}</h1>
    </header>
  )
}
