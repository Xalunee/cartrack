import Link from 'next/link'
import {
  ArrowRight,
  BarChart2,
  Calendar,
  FileDown,
  FileText,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
  Wrench,
} from 'lucide-react'
import { Button } from '@shared/ui'

const navigation = [
  { label: 'Возможности', href: '#features' },
  { label: 'Как работает', href: '#how-it-works' },
  { label: 'Цена', href: '#pricing' },
  { label: 'О проекте', href: '#about' },
]

const maintenanceItems = [
  { title: 'Замена масла', meta: 'через 2 300 км', status: 'Скоро', tone: 'amber' },
  { title: 'Тормозные колодки', meta: 'через 12 100 км', status: 'OK', tone: 'green' },
  { title: 'Воздушный фильтр', meta: 'просрочен на 420 км', status: 'Критично', tone: 'red' },
  { title: 'Шины', meta: 'давление и сезонность', status: 'OK', tone: 'green' },
]

const stats = [
  { value: '87 420', label: 'км на одометре' },
  { value: '12', label: 'замен в истории' },
  { value: '42 800 ₽', label: 'потрачено за год' },
  { value: '3 нед.', label: 'до следующей замены' },
]

const features = [
  {
    title: 'Трекинг пробега',
    description: 'Вводи раз в неделю. Telegram-бот напомнит и примет данные.',
    icon: TrendingUp,
  },
  {
    title: 'История обслуживания',
    description: 'Дата, пробег, стоимость каждой замены в одном месте.',
    icon: Wrench,
  },
  {
    title: 'Умный прогноз',
    description: 'Считает по твоему темпу езды, показывает дату следующей замены.',
    icon: Calendar,
  },
  {
    title: 'Учёт расходов',
    description: 'Графики по месяцам и категориям: запчасти, ТО, ремонт.',
    icon: BarChart2,
  },
  {
    title: 'Журнал событий',
    description: 'Аварии, неисправности, штрафы, СТО — вся история рядом.',
    icon: FileText,
  },
  {
    title: 'Экспорт при продаже',
    description: 'PDF с полной историей в один клик. Покупатели любят такие машины.',
    icon: FileDown,
  },
]

const painPoints = [
  'Когда я менял масло?',
  'Где тот чек с СТО?',
  'Сколько потратил на машину?',
  'Пора менять фильтры?',
  'Что было на прошлом ТО?',
]

function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/70 bg-[#f7f3ec]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-stone-950">
          <span className="size-2.5 rounded-full bg-stone-950" />
          CarTrack
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-stone-600 md:flex">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-stone-950">
              {item.label}
            </Link>
          ))}
        </nav>

        <Link href="/register">
          <Button className="h-10 rounded-full bg-stone-950 px-4 text-sm text-white shadow-[0_12px_30px_rgba(28,25,23,0.18)] hover:bg-stone-800 sm:h-11 sm:px-5">
            Начать бесплатно
          </Button>
        </Link>
      </div>
    </header>
  )
}

function AppPreview() {
  return (
    <div className="relative z-0 mx-auto flex min-h-[410px] w-full max-w-[500px] max-h-[420px] items-center justify-center overflow-visible sm:min-h-[490px] sm:max-h-[500px] lg:mx-0">
      <div className="absolute inset-x-8 top-8 h-[320px] rounded-[2rem] bg-stone-200/60 blur-sm sm:h-[380px]" />

      <div className="absolute left-5 top-20 z-20 hidden w-52 overflow-hidden rounded-3xl border border-white/80 bg-white/80 p-4 shadow-[0_24px_70px_rgba(87,83,78,0.16)] backdrop-blur-xl sm:block md:left-3">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-stone-400">Расходы за год</p>
        <p className="mt-2 text-xl font-semibold text-stone-950">42 800 ₽</p>
        <div className="mt-4 flex h-10 items-end gap-2">
          {[28, 36, 42, 35, 48, 54, 50, 64, 60, 72].map((height, index) => (
            <span
              key={index}
              className="w-full rounded-full bg-blue-500/80"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 w-[min(76vw,250px)] rounded-[2rem] border border-stone-200 bg-white p-2.5 shadow-[0_32px_90px_rgba(68,64,60,0.18)] sm:w-[min(72vw,270px)]">
        <div className="absolute left-1/2 top-3 h-5 w-20 -translate-x-1/2 rounded-full bg-stone-950" />
        <div className="max-h-[390px] overflow-hidden rounded-[1.55rem] bg-[#fbfaf7] px-4 pb-4 pt-8 sm:max-h-[470px] sm:px-5 sm:pb-5 sm:pt-9">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-stone-400">Skoda Octavia</p>
              <h2 className="mt-1 text-lg font-semibold text-stone-950 sm:text-xl">2019 · 1.4 TSI</h2>
            </div>
            <div className="rounded-full bg-stone-100 px-2 py-1 text-xs text-stone-500">•••</div>
          </div>

          <div className="mt-7 sm:mt-9">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-400">Текущий пробег</p>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">87 420</span>
              <span className="pb-1 text-sm text-stone-400">км</span>
            </div>
            <div className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              +248 км за неделю
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-stone-200 pt-4 sm:mt-8">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-stone-400">
              Обслуживание
            </p>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-stone-400">4 пункта</p>
          </div>

          <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
            {maintenanceItems.map((item) => (
              <div key={item.title} className="rounded-2xl border border-stone-200/70 bg-white/70 p-2.5 sm:p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-950">{item.title}</p>
                    <p className="mt-0.5 text-xs text-stone-400">{item.meta}</p>
                  </div>
                  <span
                    className={
                      item.tone === 'red'
                        ? 'rounded-full bg-red-50 px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-red-600'
                        : item.tone === 'amber'
                          ? 'rounded-full bg-amber-50 px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-amber-700'
                          : 'rounded-full bg-emerald-50 px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-emerald-700'
                    }
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 right-5 z-20 w-44 rounded-3xl border border-white/80 bg-white/85 p-4 shadow-[0_24px_70px_rgba(87,83,78,0.16)] backdrop-blur-xl sm:bottom-16 sm:right-4 sm:w-48 sm:p-5">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-stone-400">След. замена масла</p>
        <p className="mt-2 text-xl font-semibold text-stone-950 sm:text-2xl">~15 авг</p>
        <p className="mt-1 text-xs text-stone-500">прогноз по темпу езды</p>
      </div>
    </div>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f7f3ec] text-stone-950">
      <LandingHeader />

      <main>
        <section className="relative z-0 mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_0.92fr] lg:items-center lg:px-10 lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex max-w-full items-center rounded-full border border-blue-500/70 bg-blue-50/70 px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-blue-700 shadow-sm sm:px-4 sm:tracking-[0.32em]">
              Трекер автомобиля · 2026
            </div>

            <h1 className="mt-7 max-w-2xl text-4xl font-semibold leading-[0.98] tracking-tight text-stone-950 sm:text-5xl md:text-6xl">
              Знай свою машину. Всегда.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-stone-600 sm:text-lg">
              Спокойный журнал для пробега, обслуживания и расходов. Без таблиц в Excel, без чеков в
              бардачке, без «когда я в последний раз менял масло».
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="w-full sm:w-auto">
                <Button className="h-14 w-full rounded-full bg-stone-950 px-7 text-base text-white shadow-[0_18px_38px_rgba(28,25,23,0.2)] hover:bg-stone-800 sm:w-auto">
                  Завести машину в журнал
                </Button>
              </Link>
              <Link
                href="#features"
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white/55 px-5 text-base font-medium text-stone-950 transition hover:bg-white/80 sm:w-auto sm:bg-transparent"
              >
                Посмотреть возможности <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="mt-8 inline-flex rounded-full border border-stone-200/80 bg-white/45 px-4 py-2 text-sm font-medium text-stone-600">
              Бесплатно для одной машины · Без рекламы
            </div>
          </div>

          <AppPreview />
        </section>

        <section className="border-y border-stone-200/80">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 py-6 sm:px-8 lg:grid-cols-4 lg:px-10">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-3xl bg-white/35 p-5">
                <p className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">{stat.value}</p>
                <p className="mt-2 text-sm text-stone-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-8 sm:py-28 lg:px-10">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">Возможности</p>
              <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
                Всё важное про машину в одном спокойном месте.
              </h2>
            </div>
            <p className="max-w-md text-base leading-7 text-stone-600">
              CarTrack собирает обслуживание, пробег и расходы в понятную историю, которую легко вести и не стыдно показать при продаже.
            </p>
          </div>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="group rounded-[1.5rem] border border-white/80 bg-white/55 p-6 shadow-[0_16px_45px_rgba(87,83,78,0.08)] backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/75 hover:shadow-[0_24px_60px_rgba(87,83,78,0.12)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-stone-950 text-white">
                      <Icon className="size-5" />
                    </div>
                    <p className="text-sm font-semibold text-stone-400">{String(index + 1).padStart(2, '0')}</p>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold tracking-tight text-stone-950">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-stone-600">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-5xl px-4 pb-16 sm:px-8 lg:px-10">
          <div className="rounded-[2rem] border border-white/80 bg-white/60 p-6 text-center shadow-[0_22px_70px_rgba(87,83,78,0.1)] backdrop-blur-xl sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">Звучит знакомо?</p>
            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-stone-950">
              CarTrack помнит за вас
            </h2>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {painPoints.map((point) => (
                <span key={point} className="rounded-full border border-stone-300/70 bg-white/70 px-4 py-2.5 text-sm font-semibold text-stone-800 shadow-sm sm:text-base">
                  {point}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="px-4 pb-20 sm:px-8 sm:pb-24 lg:px-10">
          <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/80 bg-white/65 p-6 text-center shadow-[0_28px_90px_rgba(87,83,78,0.12)] backdrop-blur-xl sm:rounded-[2.3rem] sm:p-12 lg:p-16">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-stone-950 text-white">
              <ShieldCheck className="size-6" />
            </div>
            <h2 className="mx-auto mt-7 max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
              Начни следить за машиной сегодня
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-stone-600 sm:text-lg">
              Бесплатно для одной машины навсегда. Без карты, без рекламы, без рассылок «вам срочно нужно ТО».
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/register" className="w-full sm:w-auto">
                <Button className="h-14 w-full rounded-full bg-stone-950 px-8 text-base text-white shadow-[0_18px_38px_rgba(28,25,23,0.2)] hover:bg-stone-800 sm:w-auto">
                  Завести журнал
                </Button>
              </Link>
              <Link
                href="https://t.me/cartrack_official_bot"
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border border-stone-200 bg-white/70 px-7 text-base font-medium text-stone-950 shadow-sm transition hover:bg-white sm:w-auto"
              >
                <MessageCircle className="size-4" />
                Открыть Telegram-бота
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer id="about" className="border-t border-stone-200/80 px-4 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center text-sm text-stone-500 sm:flex-row sm:text-left">
          <p className="font-medium text-stone-950">CarTrack © 2026</p>
          <p>Сделано для тех, кто любит свою машину.</p>
        </div>
      </footer>
    </div>
  )
}
