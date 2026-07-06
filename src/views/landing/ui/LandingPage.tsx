import Link from 'next/link'
import {
  AlertTriangle,
  BarChart3,
  Check,
  FileText,
  Gauge,
  LayoutDashboard,
  Settings,
  Wrench,
} from 'lucide-react'
import { MagneticButton, RotatingWord } from '@shared/ui'
import { Reveal } from './Reveal'

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

const previewNav = [
  { label: 'Главная', icon: LayoutDashboard, active: true },
  { label: 'Обслуживание', icon: Wrench, active: false },
  { label: 'Пробег', icon: Gauge, active: false },
  { label: 'События', icon: AlertTriangle, active: false },
  { label: 'Настройки', icon: Settings, active: false },
]

const previewMaintenance = [
  {
    title: 'Замена масла',
    meta: 'осталось 2 300 км',
    status: 'Скоро',
    badge: 'bg-[#FEF9E7] text-[#B08A00]',
  },
  {
    title: 'Тормозные колодки',
    meta: 'запас 12 100 км',
    status: 'OK',
    badge: 'bg-[#EDF7ED] text-[#2E7D32]',
  },
  {
    title: 'Воздушный фильтр',
    meta: 'просрочен на 420 км',
    status: 'Критично',
    badge: 'bg-[#FDEBEC] text-[#C62828]',
  },
]

function ProductPreview() {
  const chartPoints = '0,34 40,30 80,32 120,22 160,26 200,14 240,18 280,8'
  return (
    <div className="grid grid-cols-[168px_1fr] bg-[#FBFBFA] text-left">
      {/* Sidebar */}
      <aside className="hidden flex-col gap-1 border-r border-[#EFEEEC] bg-white p-3 sm:flex">
        <div className="mb-3 flex items-center gap-2 px-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-[#191918]">
            <span className="text-[8px] font-bold text-white">CT</span>
          </div>
          <span className="text-[13px] font-semibold text-[#191918]">CarTrack</span>
        </div>
        {previewNav.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.label}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] ${
                item.active ? 'bg-[#F1F0EE] font-medium text-[#191918]' : 'text-[#6B6B6B]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </div>
          )
        })}
      </aside>

      {/* Main area */}
      <div className="p-4 sm:p-5">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-[12px] text-[#9B9A97]">Skoda Octavia · 2019</p>
            <h3 className="text-[15px] font-semibold text-[#191918]">Личный кабинет</h3>
          </div>
          <span className="rounded-md bg-[#EDF7ED] px-2 py-0.5 text-[11px] font-medium text-[#2E7D32]">
            Всё под контролем
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Mileage card */}
          <div className="rounded-lg border border-[#EFEEEC] bg-white p-4">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] text-[#9B9A97]">
              <Gauge className="h-3.5 w-3.5" />
              Текущий пробег
            </div>
            <div className="flex items-end gap-1.5">
              <span className="text-2xl font-semibold tracking-tight text-[#191918]">87 420</span>
              <span className="pb-1 text-[12px] text-[#9B9A97]">км</span>
            </div>
            <svg viewBox="0 0 280 40" className="mt-3 h-9 w-full" preserveAspectRatio="none">
              <polyline
                points={chartPoints}
                fill="none"
                stroke="#2383E2"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-1 text-[11px] text-[#2E7D32]">+248 км за неделю</p>
          </div>

          {/* Spending card */}
          <div className="rounded-lg border border-[#EFEEEC] bg-white p-4">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] text-[#9B9A97]">
              <BarChart3 className="h-3.5 w-3.5" />
              Расходы за год
            </div>
            <div className="flex items-end gap-1.5">
              <span className="text-2xl font-semibold tracking-tight text-[#191918]">42 800</span>
              <span className="pb-1 text-[12px] text-[#9B9A97]">₽</span>
            </div>
            <div className="mt-3 flex h-9 items-end gap-1.5">
              {[40, 55, 38, 62, 48, 70].map((h, i) => (
                <span
                  key={i}
                  className="w-full rounded-sm bg-[#EBF5FE]"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <p className="mt-1 text-[11px] text-[#9B9A97]">запчасти · ТО · топливо</p>
          </div>
        </div>

        {/* Maintenance rows */}
        <div className="mt-3 rounded-lg border border-[#EFEEEC] bg-white p-4">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] text-[#9B9A97]">
            <Wrench className="h-3.5 w-3.5" />
            Обслуживание
          </div>
          <div className="divide-y divide-[#F1F0EE]">
            {previewMaintenance.map((item) => (
              <div key={item.title} className="flex items-center justify-between py-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#191918]">{item.title}</p>
                  <p className="text-[11px] text-[#9B9A97]">{item.meta}</p>
                </div>
                <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${item.badge}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#191918]">
      <LandingNav />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 pb-12 pt-16 text-center">
          <h1 className="mb-5 font-serif text-4xl leading-[1.05] tracking-tight text-[#191918] md:text-7xl">
            Знай свою машину.
            <br />
            Без{' '}
            <RotatingWord words={['таблиц', 'чеков в бардачке', 'забытых замен', 'лишних трат']} />
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-lg text-[#6B6B6B]">
            CarTrack помнит каждую замену масла и предупреждает за недели до срока — по вашему реальному
            темпу езды.
          </p>
          <div className="mb-3 flex items-center justify-center gap-5">
            <MagneticButton
              as="a"
              href="/register"
              className="rounded-lg bg-[#191918] px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-[#191918]/85"
            >
              Завести журнал
            </MagneticButton>
            <a href="#features" className="text-[15px] text-[#2383E2] hover:underline">
              Посмотреть возможности →
            </a>
          </div>
          <p className="text-[13px] text-[#9B9A97]">Бесплатно · Без рекламы · С Telegram-ботом</p>
        </section>

        {/* Product preview */}
        <section className="mx-auto max-w-5xl px-6 pb-20">
          <div className="overflow-hidden rounded-xl border border-[#EFEEEC] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
            {/* Browser chrome bar */}
            <div className="flex items-center gap-1.5 border-b border-[#EFEEEC] bg-[#FBFBFA] px-4 py-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[#EFEEEC]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#EFEEEC]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#EFEEEC]" />
            </div>
            <ProductPreview />
          </div>
        </section>

        {/* Bento features */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-20">
          <Reveal>
            <p className="mb-3 text-[13px] font-medium uppercase tracking-wider text-[#9B9A97]">
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
              <div className="h-full rounded-2xl bg-[#EBF5FE] p-6">
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
                <p className="mt-1 text-sm text-[#6B6B6B]">Вносите раз в неделю — остальное посчитаем.</p>
                <div className="mt-5 rounded-lg bg-white p-4 shadow-sm">
                  <div className="flex items-end gap-1.5">
                    <span className="text-2xl font-semibold tracking-tight text-[#191918]">87 420</span>
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
              <div className="h-full rounded-2xl bg-[#EDF7ED] p-6">
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
          <div className="grid items-center gap-10 md:grid-cols-2">
            <Reveal>
              <p className="mb-3 text-[13px] font-medium uppercase tracking-wider text-[#9B9A97]">
                Telegram-бот
              </p>
              <h2 className="mb-4 font-serif text-4xl tracking-tight text-[#191918]">
                Вносите пробег,
                <br />не открывая приложение
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
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#191918]">
                      <span className="text-[9px] font-bold text-white">CT</span>
                    </div>
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
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#191918]">
                      <span className="text-[9px] font-bold text-white">CT</span>
                    </div>
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
            <p className="mb-3 text-[13px] font-medium uppercase tracking-wider text-[#9B9A97]">
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
                  <p className="font-serif text-4xl text-[#2383E2]">{step.n}</p>
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
            <div className="rounded-2xl bg-[#FEF9E7] px-8 py-16 text-center">
              <h2 className="mb-4 font-serif text-4xl tracking-tight text-[#191918] md:text-5xl">
                Начните следить за машиной сегодня
              </h2>
              <p className="mb-8 text-[#6B6B6B]">Бесплатно для одной машины. Без карты, без рекламы.</p>
              <MagneticButton
                as="a"
                href="/register"
                className="rounded-lg bg-[#191918] px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-[#191918]/85"
              >
                Завести журнал
              </MagneticButton>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-[#EFEEEC]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col justify-between gap-8 md:flex-row">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#191918]">
                  <span className="text-[10px] font-bold text-white">CT</span>
                </div>
                <span className="text-[15px] font-semibold text-[#191918]">CarTrack</span>
              </div>
              <p className="max-w-xs text-sm text-[#6B6B6B]">
                Трекер обслуживания автомобиля. Сделано для тех, кто любит свою машину.
              </p>
            </div>

            <div className="flex gap-12">
              <div>
                <p className="mb-3 text-xs uppercase tracking-wider text-[#9B9A97]">Продукт</p>
                <div className="flex flex-col gap-2">
                  <a href="#features" className="text-sm text-[#6B6B6B] transition-colors hover:text-[#191918]">
                    Возможности
                  </a>
                  <Link href="/register" className="text-sm text-[#6B6B6B] transition-colors hover:text-[#191918]">
                    Регистрация
                  </Link>
                  <Link href="/login" className="text-sm text-[#6B6B6B] transition-colors hover:text-[#191918]">
                    Войти
                  </Link>
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs uppercase tracking-wider text-[#9B9A97]">Поддержка</p>
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
