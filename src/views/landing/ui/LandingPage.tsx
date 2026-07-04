import Link from 'next/link'
import {
  ArrowRight,
  BarChart2,
  Calendar,
  FileDown,
  FileText,
  AlertTriangle,
  LayoutDashboard,
  MessageCircle,
  Settings,
  ShieldCheck,
  TrendingUp,
  Wrench,
} from 'lucide-react'
import { BlurText, MagneticButton } from '@shared/ui'

const navigation = [
  { label: 'Возможности', href: '#features' },
  { label: 'Как работает', href: '#how' },
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
    description: 'Аварии, неисправности, штрафы, СТО - вся история рядом.',
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

function AuroraBackdrop() {
  return (
    <>
      <div className="fixed inset-0 -z-10 overflow-hidden bg-[#0a0a0b]">
        <div
          className="absolute left-[-10%] top-[-20%] h-[60%] w-[60%] rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle, #1e40af 0%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'aurora1 8s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute right-[-15%] top-[10%] h-[55%] w-[55%] rounded-full opacity-35"
          style={{
            background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'aurora2 10s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute bottom-[-20%] left-[20%] h-[45%] w-[50%] rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)',
            filter: 'blur(100px)',
            animation: 'aurora3 12s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute bottom-[5%] right-[18%] h-[35%] w-[35%] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, #4338ca 0%, transparent 70%)',
            filter: 'blur(90px)',
            animation: 'aurora4 14s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=%270 0 256 256%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27noise%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23noise)%27/%3E%3C/svg%3E")',
          }}
        />
      </div>
      <style>{`
        @keyframes aurora1 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(5%, 10%) scale(1.15); }
        }
        @keyframes aurora2 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-8%, -5%) scale(1.1); }
        }
        @keyframes aurora3 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(5%, -8%) scale(1.2); }
        }
        @keyframes aurora4 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-6%, 6%) scale(1.12); }
        }
      `}</style>
    </>
  )
}

function LandingHeader() {
  return (
    <div className="fixed left-0 right-0 top-4 z-50 px-4 sm:px-8 lg:px-10">
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/10 bg-black/60 px-3 py-2 shadow-lg shadow-black/40 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2 px-2">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white">
            <span className="text-xs font-bold text-black">CT</span>
          </div>
          <span className="text-sm font-medium text-white">CarTrack</span>
        </Link>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 text-[13px] text-white/60 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <MagneticButton
          as="a"
          href="/register"
          className="rounded-full bg-white px-4 py-1.5 text-[13px] font-medium text-black transition-colors hover:bg-white/90"
        >
          Начать
        </MagneticButton>
      </nav>
    </div>
  )
}

function AppPreview() {
  return (
    <div className="relative z-0 mx-auto flex max-h-[420px] min-h-[410px] w-full max-w-[500px] items-center justify-center overflow-visible sm:max-h-[500px] sm:min-h-[490px] lg:mx-0">
      <div className="absolute inset-x-8 top-8 h-[320px] rounded-[2rem] bg-blue-500/10 blur-2xl sm:h-[380px]" />

      <div className="absolute left-5 top-20 z-20 hidden w-52 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.08] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:block md:left-3">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-white/60">Расходы за год</p>
        <p className="mt-2 text-xl font-semibold text-white">42 800 ₽</p>
        <div className="mt-4 flex h-10 items-end gap-2">
          {[28, 36, 42, 35, 48, 54, 50, 64, 60, 72].map((height, index) => (
            <span
              key={index}
              className="w-full rounded-full bg-blue-400/80"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 w-[min(76vw,250px)] rounded-[2rem] border border-white/10 bg-white/[0.05] p-2.5 pt-5 shadow-[0_32px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:w-[min(72vw,270px)]">
        <div className="mx-auto h-4 w-[60px] rounded-full bg-black/80" />
        <div className="mt-2 flex max-h-[390px] flex-col overflow-hidden rounded-[1.55rem] border border-white/[0.08] bg-black/30 px-4 pb-3 pt-5 sm:max-h-[470px] sm:px-5 sm:pb-4 sm:pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-white/60">Skoda Octavia</p>
              <h2 className="mt-1 text-lg font-semibold text-white sm:text-xl">2019 · 1.4 TSI</h2>
            </div>
            <div className="rounded-full bg-white/[0.06] px-2 py-1 text-xs text-white/65">•••</div>
          </div>

          <div className="mt-7 sm:mt-9">
            <p className="text-xs uppercase tracking-[0.22em] text-white/60">Текущий пробег</p>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">87 420</span>
              <span className="pb-1 text-sm text-white/65">км</span>
            </div>
            <div className="mt-3 inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              +248 км за неделю
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 sm:mt-8">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-white/60">
              Обслуживание
            </p>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/60">4 пункта</p>
          </div>

          <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
            {maintenanceItems.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.05] p-2.5 sm:p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="mt-0.5 text-xs text-white/65">{item.meta}</p>
                  </div>
                  <span
                    className={
                      item.tone === 'red'
                        ? 'rounded-full bg-red-500/10 px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-red-300'
                        : item.tone === 'amber'
                          ? 'rounded-full bg-amber-500/10 px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-amber-300'
                          : 'rounded-full bg-emerald-500/10 px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-emerald-300'
                    }
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto flex items-center justify-around border-t border-white/10 py-2.5">
            <div className="flex flex-col items-center gap-1">
              <LayoutDashboard className="h-4 w-4 text-white/60" />
              <span className="text-[7px] text-white/60">Главная</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Wrench className="h-4 w-4 text-white/55" />
              <span className="text-[7px] text-white/55">Сервис</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <TrendingUp className="h-4 w-4 text-white/55" />
              <span className="text-[7px] text-white/55">Пробег</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-white/55" />
              <span className="text-[7px] text-white/55">События</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Settings className="h-4 w-4 text-white/55" />
              <span className="text-[7px] text-white/55">Настройки</span>
            </div>
          </div>
          <div className="mx-auto mb-1 mt-1.5 h-1 w-20 rounded-full bg-white/20" />
        </div>
      </div>

      <div className="absolute bottom-8 right-5 z-20 w-44 rounded-3xl border border-white/10 bg-white/[0.08] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:bottom-16 sm:right-4 sm:w-48 sm:p-5">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-white/60">След. замена масла</p>
        <p className="mt-2 text-xl font-semibold text-white sm:text-2xl">~15 авг</p>
        <p className="mt-1 text-xs text-white/70">прогноз по темпу езды</p>
      </div>
    </div>
  )
}

export function LandingPage() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#0a0a0b] text-[#f5f5f5]">
      <AuroraBackdrop />
      <LandingHeader />

      <main>
        <section className="relative z-0 mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-32 sm:px-8 sm:pb-20 sm:pt-36 lg:grid-cols-[1fr_0.92fr] lg:items-center lg:px-10 lg:pb-24">
          <div className="max-w-3xl">
            <div className="inline-flex max-w-full items-center rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/60 shadow-sm sm:px-4 sm:tracking-[0.32em]">
              Трекер автомобиля · 2026
            </div>

            <h1 className="mt-7 max-w-2xl text-4xl font-semibold leading-[0.98] tracking-tight text-white sm:text-5xl md:text-6xl">
              <BlurText text="Знай свою машину." as="span" />
              <br />
              <BlurText text="Всегда." as="span" delay={400} />
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-white/60 sm:text-lg">
              Спокойный журнал для пробега, обслуживания и расходов. Без таблиц в Excel, без чеков в
              бардачке, без «когда я в последний раз менял масло».
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <MagneticButton as="a" href="/register" className="w-full sm:w-auto">
                <span className="inline-flex h-14 w-full items-center justify-center rounded-full bg-white px-7 text-base font-medium text-black shadow-[0_18px_38px_rgba(255,255,255,0.12)] transition hover:bg-white/90 sm:w-auto">
                  Завести машину в журнал
                </span>
              </MagneticButton>
              <MagneticButton
                as="a"
                href="#features"
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-transparent px-5 text-base font-medium text-white/60 transition hover:border-white/20 hover:text-white sm:w-auto"
              >
                Посмотреть возможности <ArrowRight className="size-4" />
              </MagneticButton>
            </div>

            <div className="mt-8 inline-flex rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-white/70">
              Бесплатно для одной машины · Без рекламы
            </div>
          </div>

          <AppPreview />
        </section>

        <section className="border-y border-white/10">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 py-6 sm:px-8 lg:grid-cols-4 lg:px-10">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl">
                <p className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{stat.value}</p>
                <p className="mt-2 text-sm text-white/65">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-8 sm:py-28 lg:px-10">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">Возможности</p>
              <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                Всё важное про машину в одном спокойном месте.
              </h2>
            </div>
            <p className="max-w-md text-base leading-7 text-white/60">
              CarTrack собирает обслуживание, пробег и расходы в понятную историю, которую легко вести и не стыдно показать при продаже.
            </p>
          </div>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="group rounded-[1.5rem] border border-white/[0.08] bg-white/[0.04] p-6 shadow-[0_16px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.07] hover:shadow-[0_24px_60px_rgba(0,0,0,0.22)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-white/10 text-white">
                      <Icon className="size-5" />
                    </div>
                    <p className="text-sm font-semibold text-white/55">{String(index + 1).padStart(2, '0')}</p>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold tracking-tight text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/70">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section id="how" className="mx-auto max-w-5xl px-4 pb-16 sm:px-8 lg:px-10">
          <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-6 text-center shadow-[0_22px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">Звучит знакомо?</p>
            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white">
              CarTrack помнит за вас
            </h2>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {painPoints.map((point) => (
                <span key={point} className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white/70 shadow-sm sm:text-base">
                  {point}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-8 sm:pb-24 lg:px-10">
          <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-6 text-center shadow-[0_28px_90px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:rounded-[2.3rem] sm:p-12 lg:p-16">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-white/10 text-white">
              <ShieldCheck className="size-6" />
            </div>
            <h2 className="mx-auto mt-7 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
              Начни следить за машиной сегодня
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/60 sm:text-lg">
              Бесплатно для одной машины навсегда. Без карты, без рекламы, без рассылок «вам срочно нужно ТО».
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <MagneticButton as="a" href="/register" className="w-full sm:w-auto">
                <span className="inline-flex h-14 w-full items-center justify-center rounded-full bg-white px-8 text-base font-medium text-black shadow-[0_18px_38px_rgba(255,255,255,0.12)] transition hover:bg-white/90 sm:w-auto">
                  Завести журнал
                </span>
              </MagneticButton>
              <MagneticButton
                as="a"
                href="https://t.me/cartrack_official_bot"
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-transparent px-7 text-base font-medium text-white/80 shadow-sm transition hover:border-white/35 hover:text-white sm:w-auto"
              >
                <MessageCircle className="size-4" />
                Открыть Telegram-бота
              </MagneticButton>
            </div>
          </div>
        </section>
      </main>

      <footer id="about" className="border-t border-white/[0.05] px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col justify-between gap-8 md:flex-row">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="font-medium text-white">CarTrack</span>
              </div>
              <p className="max-w-xs text-sm text-white/65">
                Трекер обслуживания автомобиля. Сделано для тех, кто любит свою машину.
              </p>
            </div>

            <div className="flex gap-12">
              <div>
                <p className="mb-3 text-xs uppercase tracking-wider text-white/55">Продукт</p>
                <div className="flex flex-col gap-2">
                  <Link href="#features" className="text-sm text-white/60 transition-colors hover:text-white">Возможности</Link>
                  <Link href="/register" className="text-sm text-white/60 transition-colors hover:text-white">Регистрация</Link>
                  <Link href="/login" className="text-sm text-white/60 transition-colors hover:text-white">Войти</Link>
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs uppercase tracking-wider text-white/55">Поддержка</p>
                <div className="flex flex-col gap-2">
                  <a href="https://t.me/cartrack_official_bot" className="text-sm text-white/60 transition-colors hover:text-white">Telegram-бот</a>
                  <a href="mailto:xalune.work@gmail.com" className="text-sm text-white/60 transition-colors hover:text-white">xalune.work@gmail.com</a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between border-t border-white/[0.05] pt-6">
            <span className="text-xs text-white/55">© 2026 CarTrack</span>
            <span className="text-xs text-white/55">RU / EN</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
