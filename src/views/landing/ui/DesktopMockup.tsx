import {
  BarChart2,
  ChevronRight,
  LogOut,
  MoreHorizontal,
  Moon,
  Plus,
  RefreshCw,
  TrendingUp,
  Wrench,
} from 'lucide-react'
import { Logo } from '@shared/ui'
import {
  chartColor,
  mileageChartPoints,
  mileageChartPolyline,
  mockCar,
  mockMaintenance,
  mockMileageHistory,
  mockNav,
  mockPeriods,
  mockSpending,
  statusColor,
} from './mockData'

/**
 * Статичная копия десктопного дашборда для лендинга.
 *
 * Повторяет реальный интерфейс: сайдбар из трёх разделов с вложенным «Сервисом»,
 * карточки «Пробег» и «Расходы» с переключателем периода, список обслуживания
 * с цветной полосой статуса и прогресс-баром. Светлая палитра лендинга —
 * приложение само по себе поддерживает обе темы.
 */

function PeriodSwitcher() {
  return (
    <div className="flex items-center gap-0.5">
      {mockPeriods.map((period) => (
        <span
          key={period.label}
          className={`rounded-md px-1.5 py-0.5 text-[10px] ${
            period.active ? 'bg-[#F1F0EE] font-medium text-[#191918]' : 'text-[#9B9A97]'
          }`}
        >
          {period.label}
        </span>
      ))}
    </div>
  )
}

export function DesktopMockup() {
  return (
    <div className="grid grid-cols-[184px_1fr] bg-[#FBFBFA] text-left">
      {/* Sidebar */}
      <aside className="hidden flex-col border-r border-[#EFEEEC] bg-white p-3 sm:flex">
        <div className="mb-3 flex items-center gap-2 px-2">
          <Logo size={20} />
          <span className="text-[13px] font-semibold text-[#191918]">CarTrack</span>
        </div>

        {mockNav.map((section, index) => {
          const Icon = section.icon
          return (
            <div key={section.label} className={index > 0 ? 'mt-3' : undefined}>
              <div
                className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[12px] ${
                  section.active ? 'bg-[#F1F0EE] font-medium text-[#191918]' : 'text-[#6B6B6B]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {section.label}
              </div>
              {section.children?.map((child) => (
                <div key={child} className="rounded-md py-1 pr-2 pl-8 text-[11px] text-[#6B6B6B]">
                  {child}
                </div>
              ))}
            </div>
          )
        })}

        <div className="mt-auto border-t border-[#EFEEEC] pt-2">
          <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[12px] text-[#6B6B6B]">
            <LogOut className="h-3.5 w-3.5" />
            Выйти
          </div>
          <div className="flex items-center justify-between px-2 pt-1">
            <span className="text-[12px] text-[#6B6B6B]">Тема</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-md">
              <Moon className="h-3.5 w-3.5 text-[#6B6B6B]" />
            </span>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="p-4">
        {/* Car header */}
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-[#191918]">{mockCar.title}</h3>
            <p className="text-[12px] text-[#9B9A97]">{mockCar.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-3.5 w-3.5 text-[#9B9A97]" />
            <span className="rounded-md border border-[#EFEEEC] bg-white px-2 py-1 text-[11px] text-[#191918]">
              Пробег
            </span>
            <span className="flex items-center gap-1 rounded-md bg-[#191918] px-2 py-1 text-[11px] text-white">
              <Plus className="h-3 w-3" />
              Позиция
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Mileage card */}
          <div className="rounded-lg border border-[#EFEEEC] bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-y-2">
              <div className="flex items-center gap-2 text-[13px] font-medium text-[#191918]">
                <TrendingUp className="h-3.5 w-3.5" />
                Пробег
              </div>
              <div className="flex items-center gap-2">
                <PeriodSwitcher />
                <span className="flex items-center gap-1 rounded-md border border-[#EFEEEC] px-1.5 py-0.5 text-[10px] text-[#191918]">
                  <Plus className="h-2.5 w-2.5" />
                  Внести
                </span>
              </div>
            </div>

            <div className="flex items-end gap-1.5">
              <span className="text-2xl font-semibold tracking-tight text-[#191918]">
                {mockCar.mileage}
              </span>
              <span className="pb-1 text-[12px] text-[#9B9A97]">км</span>
            </div>
            <p className="mt-0.5 text-[11px] text-[#9B9A97]">{mockCar.perWeek}</p>

            {/*
              svg тянется по ширине карточки, поэтому масштаб по осям разный:
              точки рисуем отдельным HTML-слоем, иначе круги сплющиваются
              в эллипсы, а линии нужен non-scaling-stroke, чтобы не плыла толщина.
            */}
            <div className="relative mt-2 h-8 w-full">
              <svg viewBox="0 0 280 44" className="h-full w-full" preserveAspectRatio="none">
                <polyline
                  points={mileageChartPolyline}
                  fill="none"
                  stroke={chartColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              {mileageChartPoints.map((point) => (
                <span
                  key={point.x}
                  className="absolute h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    left: `${(point.x / 280) * 100}%`,
                    top: `${(point.y / 44) * 100}%`,
                    backgroundColor: chartColor,
                  }}
                />
              ))}
            </div>

            <p className="mt-2 text-[10px] font-medium tracking-wider text-[#9B9A97] uppercase">
              История
            </p>
            <div className="divide-y divide-[#F1F0EE]">
              {mockMileageHistory.map((entry) => (
                <div key={entry.mileage} className="flex items-center justify-between py-0.5">
                  <p className="min-w-0 truncate">
                    <span className="text-[12px] text-[#191918]">{entry.mileage} км</span>{' '}
                    <span className="text-[10px] text-[#9B9A97]">{entry.meta}</span>
                  </p>
                  <MoreHorizontal className="h-3 w-3 flex-shrink-0 text-[#C7C6C2]" />
                </div>
              ))}
            </div>
          </div>

          {/* Spending card */}
          <div className="flex flex-col rounded-lg border border-[#EFEEEC] bg-white p-4">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-y-2">
              <div>
                <div className="flex items-center gap-2 text-[13px] font-medium text-[#191918]">
                  <BarChart2 className="h-3.5 w-3.5" />
                  Расходы
                </div>
                <p className="mt-0.5 text-[10px] text-[#9B9A97]">{mockSpending.period}</p>
              </div>
              <div className="flex items-center gap-2">
                <PeriodSwitcher />
                <span className="text-[13px] font-semibold text-[#191918]">
                  {mockSpending.total}
                </span>
              </div>
            </div>

            <div className="flex min-h-16 flex-1 items-end justify-around gap-2">
              {mockSpending.items.map((item) => (
                <span
                  key={item.label}
                  className="w-7 rounded-t-[3px]"
                  style={{ height: `${item.height}%`, backgroundColor: chartColor }}
                />
              ))}
            </div>

            <div className="mt-2 space-y-1">
              {mockSpending.items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-2 text-[10px] text-[#9B9A97]"
                >
                  <span className="truncate">{item.label}</span>
                  <span>{item.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Maintenance */}
        <div className="mt-3 mb-1.5 flex items-center justify-between">
          <div className="flex items-center gap-0.5 text-[13px] font-semibold text-[#191918]">
            Обслуживание
            <ChevronRight className="h-3.5 w-3.5 text-[#9B9A97]" />
          </div>
          <span className="flex items-center gap-1 rounded-md border border-[#EFEEEC] bg-white px-2 py-1 text-[11px] text-[#191918]">
            <Plus className="h-3 w-3" />
            Добавить
          </span>
        </div>

        <div className="space-y-1">
          {mockMaintenance.map((item) => {
            const color = statusColor[item.status]
            return (
              <div
                key={item.title}
                className="rounded-lg border border-l-2 border-[#EFEEEC] bg-white p-2"
                style={{ borderLeftColor: color }}
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-[#191918]">{item.title}</p>
                    <p className="mt-0.5 text-[10px] text-[#9B9A97]">{item.remaining}</p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span
                      className="rounded-md px-2 py-0.5 text-[10px] font-medium text-white"
                      style={{ backgroundColor: color }}
                    >
                      {item.statusLabel}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] ${
                        item.status === 'ok'
                          ? 'border border-[#EFEEEC] text-[#191918]'
                          : 'bg-[#191918] text-white'
                      }`}
                    >
                      Заменил
                    </span>
                    <Wrench className="h-3 w-3 text-[#9B9A97]" />
                  </div>
                </div>

                <div className="h-1 w-full overflow-hidden rounded-full bg-[#F1F0EE]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.usedPercent}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
