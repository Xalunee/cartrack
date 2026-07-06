import Link from 'next/link'
import { MagneticButton } from '@shared/ui'

function LandingNav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[#EFEEEC] bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#191918]">
            <span className="text-[10px] font-bold text-white">CT</span>
          </div>
          <span className="text-[15px] font-semibold text-[#191918]">CarTrack</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <a href="#features" className="text-sm text-[#6B6B6B] transition-colors hover:text-[#191918]">
            Возможности
          </a>
          <a href="#telegram" className="text-sm text-[#6B6B6B] transition-colors hover:text-[#191918]">
            Telegram-бот
          </a>
          <a href="#how" className="text-sm text-[#6B6B6B] transition-colors hover:text-[#191918]">
            Как работает
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-sm text-[#6B6B6B] transition-colors hover:text-[#191918] sm:block">
            Войти
          </Link>
          <MagneticButton
            as="a"
            href="/register"
            className="rounded-lg bg-[#191918] px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#191918]/85"
          >
            Завести журнал
          </MagneticButton>
        </div>
      </div>
    </nav>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#191918]">
      <LandingNav />

      <main>
        <section className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h1 className="mb-5 font-serif text-5xl tracking-tight text-[#191918]">Знай свою машину.</h1>
        </section>
      </main>
    </div>
  )
}
