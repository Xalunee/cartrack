import Link from 'next/link'
import { Check, FileText } from 'lucide-react'
import { Logo, RotatingWord } from '@shared/ui'
import {
  CarSideIllustration,
  WrenchIllustration,
  ChartIllustration,
  Underline,
  Arrow,
  Sparkle,
} from '@shared/ui/illustrations'
import { Reveal } from './Reveal'
import { DesktopMockup } from './DesktopMockup'
import { PhoneMockup } from './PhoneMockup'

function LandingNav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[#EFEEEC] bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={24} />
          <span className="text-[15px] font-semibold text-[#191918]">CarTrack</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <a
            href="#features"
            className="text-sm text-[#6B6B6B] transition-colors hover:text-[#191918]"
          >
            Возможности
          </a>
          <a
            href="#telegram"
            className="text-sm text-[#6B6B6B] transition-colors hover:text-[#191918]"
          >
            Telegram-бот
          </a>
          <a href="#how" className="text-sm text-[#6B6B6B] transition-colors hover:text-[#191918]">
            Как работает
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm text-[#6B6B6B] transition-colors hover:text-[#191918] sm:block"
          >
            Войти
          </Link>
          <a
            href="/register"
            className="rounded-lg border border-[#191918] px-3.5 py-1.5 text-sm font-medium text-[#191918] transition-colors hover:bg-[#191918] hover:text-white"
          >
            Завести журнал
          </a>
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
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 pt-16 pb-12 text-center">
          <CarSideIllustration className="mx-auto mb-6 h-auto w-32 text-[#191918]" />
          <h1 className="mb-5 font-serif text-4xl leading-[1.05] tracking-tight text-[#191918] md:text-7xl">
            Знай свою машину.
            <br />
            Без{' '}
            <span className="relative inline-block">
              <RotatingWord
                words={['таблиц', 'чеков в бардачке', 'забытых замен', 'лишних трат']}
              />
              <Sparkle className="absolute -top-3 -right-5 h-4 w-4 text-[#2383E2] md:-top-4 md:-right-7 md:h-5 md:w-5" />
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-lg text-[#6B6B6B]">
            CarTrack помнит каждую замену масла и предупреждает за недели до срока — по вашему{' '}
            <span className="relative inline-block whitespace-nowrap">
              реальному темпу езды
              <Underline className="absolute -bottom-1 left-0 h-2 w-full text-[#2383E2]" />
            </span>
            .
          </p>
          <div className="mb-3 flex items-center justify-center gap-5">
            <a
              href="/register"
              className="rounded-lg border-2 border-[#191918] px-6 py-3 text-[15px] font-medium text-[#191918] transition-colors hover:bg-[#191918] hover:text-white"
            >
              Завести журнал
            </a>
            <a href="#features" className="text-[15px] text-[#2383E2] hover:underline">
              Посмотреть возможности →
            </a>
          </div>
          <p className="text-[13px] text-[#9B9A97]">Бесплатно · Без рекламы · С Telegram-ботом</p>
        </section>

        {/* Product preview */}
        <section className="mx-auto max-w-5xl px-6 pb-20">
          {/* Mobile: phone only */}
          <div className="flex justify-center md:hidden">
            <PhoneMockup />
          </div>

          {/* Desktop: browser frame with phone overlapping bottom-right */}
          <div className="relative hidden md:block">
            <div className="overflow-hidden rounded-xl border border-[#EFEEEC] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
              {/* Browser chrome bar со «светофором» macOS */}
              <div className="flex items-center gap-1.5 border-b border-[#EFEEEC] bg-[#FBFBFA] px-4 py-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
              </div>
              <DesktopMockup />
            </div>

            <div className="absolute right-0 -bottom-16 rotate-[3deg] xl:-right-6">
              <PhoneMockup />
            </div>
          </div>
        </section>

        {/* Bento features */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-20">
          <Reveal>
            <p className="mb-3 text-[13px] font-medium tracking-wider text-[#9B9A97] uppercase">
              Возможности
            </p>
            <h2 className="mb-12 font-serif text-4xl tracking-tight text-[#191918] md:text-5xl">
              Всё важное про машину
              <br />в одном спокойном месте.
            </h2>
          </Reveal>

          <div className="grid gap-4 md:grid-cols-6">
            {/* Card A — Умный прогноз (soft blue, span 4) */}
            <Reveal className="md:col-span-4" delay={0}>
              <div className="relative h-full overflow-hidden rounded-2xl bg-[#EBF5FE] p-6">
                <WrenchIllustration className="pointer-events-none absolute -top-4 -right-4 h-28 w-28 text-[#2383E2] opacity-10" />
                <h3 className="text-lg font-semibold text-[#191918]">Умный прогноз</h3>
                <p className="mt-1 text-sm text-[#6B6B6B]">
                  Считает по вашему темпу езды и заранее говорит, когда пора в сервис.
                </p>
                <div className="mt-5 rounded-lg bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium text-[#191918]">Замена масла</p>
                    <p className="text-[13px] text-[#6B6B6B]">осталось 2 300 км</p>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#F1F0EE]">
                    <div className="h-full w-[78%] rounded-full bg-[#FFD43B]" />
                  </div>
                  <p className="mt-3 text-[12px] text-[#9B9A97]">
                    След. замена ~15 августа — по вашему темпу езды
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Card B — Трекинг пробега (soft yellow, span 2) */}
            <Reveal className="md:col-span-2" delay={80}>
              <div className="h-full rounded-2xl bg-[#FEF9E7] p-6">
                <h3 className="text-lg font-semibold text-[#191918]">Трекинг пробега</h3>
                <p className="mt-1 text-sm text-[#6B6B6B]">
                  Вносите раз в неделю — остальное посчитаем.
                </p>
                <div className="mt-5 rounded-lg bg-white p-4 shadow-sm">
                  <div className="flex items-end gap-1.5">
                    <span className="text-2xl font-semibold tracking-tight text-[#191918]">
                      87 420
                    </span>
                    <span className="pb-1 text-[12px] text-[#9B9A97]">км</span>
                  </div>
                  <span className="mt-2 inline-block rounded-md bg-[#EDF7ED] px-2 py-0.5 text-[11px] font-medium text-[#2E7D32]">
                    +248 за неделю
                  </span>
                </div>
              </div>
            </Reveal>

            {/* Card C — Учёт расходов (soft green, span 2) */}
            <Reveal className="md:col-span-2" delay={0}>
              <div className="relative h-full overflow-hidden rounded-2xl bg-[#EDF7ED] p-6">
                <ChartIllustration className="pointer-events-none absolute -top-3 -right-3 h-24 w-24 text-[#2E7D32] opacity-15" />
                <h3 className="text-lg font-semibold text-[#191918]">Учёт расходов</h3>
                <p className="mt-1 text-sm text-[#6B6B6B]">Запчасти, ТО и ремонт — по месяцам.</p>
                <div className="mt-5 flex h-16 items-end gap-2 rounded-lg bg-white p-4 shadow-sm">
                  <span className="w-full rounded-sm bg-[#DDEEDD]" style={{ height: '45%' }} />
                  <span className="w-full rounded-sm bg-[#2383E2]" style={{ height: '100%' }} />
                  <span className="w-full rounded-sm bg-[#DDEEDD]" style={{ height: '60%' }} />
                </div>
              </div>
            </Reveal>

            {/* Card D — Журнал событий (soft purple, span 2) */}
            <Reveal className="md:col-span-2" delay={80}>
              <div className="h-full rounded-2xl bg-[#F6F0FA] p-6">
                <h3 className="text-lg font-semibold text-[#191918]">Журнал событий</h3>
                <p className="mt-1 text-sm text-[#6B6B6B]">Сервис, штрафы, поломки — всё рядом.</p>
                <div className="mt-5 space-y-2">
                  <div className="rounded-lg bg-white px-3 py-2 text-[13px] text-[#191918] shadow-sm">
                    🔧 СТО · замена колодок
                  </div>
                  <div className="rounded-lg bg-white px-3 py-2 text-[13px] text-[#191918] shadow-sm">
                    ⚠️ Штраф · 500 ₽
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Card E — Экспорт при продаже (soft gray, span 2) */}
            <Reveal className="md:col-span-2" delay={160}>
              <div className="h-full rounded-2xl bg-[#F7F6F4] p-6">
                <h3 className="text-lg font-semibold text-[#191918]">Экспорт при продаже</h3>
                <p className="mt-1 text-sm text-[#6B6B6B]">Вся история в один клик.</p>
                <div className="mt-5 flex items-center gap-3 rounded-lg bg-white p-4 shadow-sm">
                  <div className="flex h-10 w-8 flex-shrink-0 items-center justify-center rounded-md bg-[#FDEBEC]">
                    <FileText className="h-4 w-4 text-[#C62828]" />
                  </div>
                  <p className="text-[13px] text-[#6B6B6B]">История обслуживания · PDF</p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Telegram bot */}
        <section id="telegram" className="mx-auto max-w-6xl px-6 py-20">
          <div className="relative grid items-center gap-10 md:grid-cols-2">
            <Arrow className="absolute top-1/2 left-1/2 z-10 hidden h-16 w-20 -translate-x-1/2 -translate-y-1/2 -rotate-6 text-[#2383E2] lg:block" />
            <Reveal>
              <p className="mb-3 text-[13px] font-medium tracking-wider text-[#9B9A97] uppercase">
                Telegram-бот
              </p>
              <h2 className="mb-4 font-serif text-4xl tracking-tight text-[#191918]">
                Вносите пробег,
                <br />
                не открывая приложение
              </h2>
              <p className="mb-6 text-[#6B6B6B]">
                Бот сам напомнит раз в неделю. Ответьте числом — и всё обновится: прогнозы, статусы,
                графики.
              </p>
              <ul className="space-y-3">
                {[
                  'Еженедельные напоминания',
                  'Статус машины одной командой',
                  'Защищённая привязка по коду',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#EDF7ED]">
                      <Check className="h-3 w-3 text-[#2E7D32]" />
                    </span>
                    <span className="text-[15px] text-[#191918]">{item}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* Chat mockup */}
            <Reveal delay={120}>
              <div className="rounded-2xl bg-[#EBF5FE] p-6">
                <div className="space-y-3 rounded-xl bg-white p-4">
                  <div className="flex items-start gap-2">
                    <Logo size={24} className="flex-shrink-0" title="CarTrack" />
                    <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-[#F7F6F4] px-3 py-2 text-[13px] text-[#191918]">
                      🚗 Пора внести пробег! Текущий: 87 420 км
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="rounded-2xl rounded-tr-sm bg-[#2383E2] px-3 py-2 text-[13px] font-medium text-white">
                      87 650
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Logo size={24} className="flex-shrink-0" title="CarTrack" />
                    <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-[#F7F6F4] px-3 py-2 text-[13px] leading-relaxed text-[#191918]">
                      ✅ Пробег обновлён! +230 км
                      <br />
                      ⚠️ Замена масла — осталось 2 070 км
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl px-6 py-20">
          <Reveal>
            <p className="mb-3 text-[13px] font-medium tracking-wider text-[#9B9A97] uppercase">
              Как работает
            </p>
            <h2 className="mb-12 font-serif text-4xl tracking-tight text-[#191918] md:text-5xl">
              Три шага — и машина под контролем
            </h2>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                n: '01',
                title: 'Добавьте машину',
                text: 'Зарегистрируйтесь и укажите марку, год и текущий пробег.',
              },
              {
                n: '02',
                title: 'Внесите обслуживание',
                text: 'Масло, фильтры, шины — что и когда меняли или планируете.',
              },
              {
                n: '03',
                title: 'Отвечайте боту',
                text: 'Раз в неделю присылайте пробег — остальное CarTrack считает сам.',
              },
            ].map((step, i) => (
              <Reveal key={step.n} delay={i * 80}>
                <div>
                  <p className="relative inline-block font-serif text-4xl text-[#2383E2]">
                    {step.n}
                    <Sparkle className="absolute -top-1 -right-4 h-3.5 w-3.5 text-[#2383E2] opacity-70" />
                  </p>
                  <h3 className="mt-3 text-lg font-semibold text-[#191918]">{step.title}</h3>
                  <p className="mt-1 text-sm text-[#6B6B6B]">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl bg-[#FEF9E7] px-8 py-16 text-center">
              <CarSideIllustration className="pointer-events-none absolute bottom-2 -left-6 hidden h-auto w-48 text-[#191918] opacity-15 md:block" />
              <Sparkle className="pointer-events-none absolute top-8 right-10 h-5 w-5 text-[#B08A00] opacity-60" />
              <Sparkle className="pointer-events-none absolute top-20 right-24 h-3.5 w-3.5 text-[#B08A00] opacity-40" />
              <h2 className="relative mb-4 font-serif text-4xl tracking-tight text-[#191918] md:text-5xl">
                Начните следить за машиной сегодня
              </h2>
              <p className="mb-8 text-[#6B6B6B]">
                Бесплатно для одной машины. Без карты, без рекламы.
              </p>
              <a
                href="/register"
                className="rounded-lg border-2 border-[#191918] px-6 py-3 text-[15px] font-medium text-[#191918] transition-colors hover:bg-[#191918] hover:text-white"
              >
                Завести журнал
              </a>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-[#EFEEEC]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col justify-between gap-8 md:flex-row">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Logo size={24} />
                <span className="text-[15px] font-semibold text-[#191918]">CarTrack</span>
              </div>
              <p className="max-w-xs text-sm text-[#6B6B6B]">
                Трекер обслуживания автомобиля. Сделано для тех, кто любит свою машину.
              </p>
            </div>

            <div className="flex gap-12">
              <div>
                <p className="mb-3 text-xs tracking-wider text-[#9B9A97] uppercase">Продукт</p>
                <div className="flex flex-col gap-2">
                  <a
                    href="#features"
                    className="text-sm text-[#6B6B6B] transition-colors hover:text-[#191918]"
                  >
                    Возможности
                  </a>
                  <Link
                    href="/register"
                    className="text-sm text-[#6B6B6B] transition-colors hover:text-[#191918]"
                  >
                    Регистрация
                  </Link>
                  <Link
                    href="/login"
                    className="text-sm text-[#6B6B6B] transition-colors hover:text-[#191918]"
                  >
                    Войти
                  </Link>
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs tracking-wider text-[#9B9A97] uppercase">Поддержка</p>
                <div className="flex flex-col gap-2">
                  <a
                    href="https://t.me/cartrack_official_bot"
                    className="text-sm text-[#6B6B6B] transition-colors hover:text-[#191918]"
                  >
                    Telegram-бот
                  </a>
                  <a
                    href="mailto:xalune.work@gmail.com"
                    className="text-sm text-[#6B6B6B] transition-colors hover:text-[#191918]"
                  >
                    xalune.work@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between border-t border-[#EFEEEC] pt-6">
            <span className="text-xs text-[#9B9A97]">© 2026 CarTrack</span>
            <span className="text-xs text-[#9B9A97]">RU / EN</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
