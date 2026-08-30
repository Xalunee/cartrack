import {
  BarChart2,
  BatteryFull,
  Moon,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Signal,
  TrendingUp,
  Wifi,
} from 'lucide-react'
import { Logo } from '@shared/ui'
import {
  chartColor,
  mileageChartPolyline,
  mockBottomNav,
  mockCar,
  mockMileageHistory,
  mockPeriods,
  mockSpending,
} from './mockData'

/**
 * Статичная копия мобильного приложения для лендинга.
 *
 * Порядок блоков повторяет мобильный шелл: верхняя панель с логотипом и
 * переключателем темы, содержимое дашборда, три подписанных таба снизу.
 * Активный таб отличается только контрастом — в приложении он не подкрашен.
 */

function PeriodSwitcher() {
  return (
    <div className="flex items-center gap-0.5">
      {mockPeriods.map((period) => (
        <span
          key={period.label}
          className={`rounded-md px-1 py-0.5 text-[9px] ${
            period.active ? 'bg-[#F1F0EE] font-medium text-[#191918]' : 'text-[#9B9A97]'
          }`}
        >
          {period.label}
        </span>
      ))}
    </div>
  )
}

export function PhoneMockup() {
  return (
    <div className="w-[260px] rounded-[36px] border border-[#EFEEEC] bg-white shadow-xl">
      {/* Status bar: время слева, индикаторы справа, островок по центру */}
      <div className="relative flex items-center justify-between px-5 pt-2">
        <span className="text-[10px] font-semibold text-[#191918]">9:41</span>
        <div className="absolute left-1/2 h-4 w-16 -translate-x-1/2 rounded-full bg-[#191918]" />
        <div className="flex items-center gap-1 text-[#191918]">
          <Signal className="h-2.5 w-2.5" />
          <Wifi className="h-2.5 w-2.5" />
          <BatteryFull className="h-3 w-3" />
        </div>
      </div>

      {/* Top bar */}
      <div className="mt-2 flex items-center justify-between border-b border-[#EFEEEC] px-4 py-1.5">
        <div className="flex items-center gap-1.5">
          <Logo size={18} />
          <span className="text-[12px] font-semibold text-[#191918]">CarTrack</span>
        </div>
        <Moon className="h-3.5 w-3.5 text-[#6B6B6B]" />
      </div>

      <div className="px-3 pt-2.5">
        {/* Car header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-[#191918]">{mockCar.title}</p>
            <p className="text-[10px] text-[#9B9A97]">{mockCar.subtitle}</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1">
            <RefreshCw className="h-3 w-3 text-[#9B9A97]" />
            <span className="rounded-md border border-[#EFEEEC] px-1.5 py-0.5 text-[9px] text-[#191918]">
              Пробег
            </span>
            <span className="flex items-center gap-0.5 rounded-md bg-[#191918] px-1.5 py-0.5 text-[9px] text-white">
              <Plus className="h-2.5 w-2.5" />
              Позиция
            </span>
          </div>
        </div>

        {/* Mileage card */}
        <div className="mt-2.5 rounded-xl border border-[#EFEEEC] bg-[#FBFBFA] p-2.5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#191918]">
              <TrendingUp className="h-3 w-3" />
              Пробег
            </div>
            <div className="flex items-center gap-1.5">
              <PeriodSwitcher />
              <span className="flex items-center gap-0.5 rounded-md border border-[#EFEEEC] bg-white px-1 py-0.5 text-[9px] text-[#191918]">
                <Plus className="h-2 w-2" />
                Внести
              </span>
            </div>
          </div>

          <div className="flex items-end gap-1">
            <span className="text-xl font-semibold tracking-tight text-[#191918]">
              {mockCar.mileage}
            </span>
            <span className="pb-1 text-[11px] text-[#9B9A97]">км</span>
          </div>
          <p className="mt-0.5 text-[10px] text-[#9B9A97]">{mockCar.perWeek}</p>

          <svg viewBox="0 0 280 44" className="mt-1.5 h-6 w-full" preserveAspectRatio="none">
            <polyline
              points={mileageChartPolyline}
              fill="none"
              stroke={chartColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <p className="mt-1.5 text-[9px] font-medium tracking-wider text-[#9B9A97] uppercase">
            История
          </p>
          <div className="divide-y divide-[#F1F0EE]">
            {mockMileageHistory.slice(0, 2).map((entry) => (
              <div key={entry.mileage} className="flex items-center justify-between gap-2 py-0.5">
                <p className="min-w-0 truncate">
                  <span className="text-[11px] text-[#191918]">{entry.mileage} км</span>{' '}
                  <span className="text-[9px] text-[#9B9A97]">{entry.meta}</span>
                </p>
                <MoreHorizontal className="h-3 w-3 flex-shrink-0 text-[#C7C6C2]" />
              </div>
            ))}
          </div>
        </div>

        {/* Spending card */}
        <div className="mt-2 rounded-xl border border-[#EFEEEC] bg-[#FBFBFA] p-2.5">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#191918]">
                <BarChart2 className="h-3 w-3" />
                Расходы
              </div>
              <p className="mt-0.5 text-[9px] text-[#9B9A97]">{mockSpending.period}</p>
            </div>
            <span className="text-[12px] font-semibold text-[#191918]">{mockSpending.total}</span>
          </div>

          <div className="flex h-10 items-end justify-around gap-1.5">
            {mockSpending.items.map((item) => (
              <span
                key={item.label}
                className="w-5 rounded-t-[3px]"
                style={{ height: `${item.height}%`, backgroundColor: chartColor }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="mt-2.5 flex items-stretch justify-around border-t border-[#EFEEEC] px-2 py-1.5">
        {mockBottomNav.map((tab) => {
          const Icon = tab.icon
          return (
            <div
              key={tab.label}
              className={`flex flex-1 flex-col items-center gap-px ${
                tab.active ? 'font-medium text-[#191918]' : 'text-[#C7C6C2]'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[9px] leading-[1.1]">{tab.label}</span>
            </div>
          )
        })}
      </div>

      {/* Home indicator */}
      <div className="mx-auto mb-2 h-1 w-20 rounded-full bg-[#191918]/20" />
    </div>
  )
}
