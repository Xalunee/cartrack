import { LayoutDashboard, Wrench, User, type LucideIcon } from 'lucide-react'

/**
 * Демо-данные для мокапов приложения на лендинге.
 *
 * Один источник правды: одни и те же машина, пробег и позиции обслуживания
 * показываются и в десктопном мокапе, и в телефоне, и в bento-карточках ниже
 * по странице. Цифры менять только вместе — иначе лендинг начнёт противоречить
 * сам себе.
 */

export const mockCar = {
  title: 'Skoda Octavia',
  subtitle: '2019 · 87 420 км',
  mileage: '87 420',
  perWeek: '~446 км/неделю',
}

export interface MockNavSection {
  label: string
  icon: LucideIcon
  active?: boolean
  children?: string[]
}

/** Повторяет NAV_SECTIONS из src/widgets/navigation/model/navigation.ts */
export const mockNav: MockNavSection[] = [
  { label: 'Главная', icon: LayoutDashboard, active: true },
  {
    label: 'Сервис',
    icon: Wrench,
    children: ['Пробег', 'Обслуживание', 'События', 'Штрафы', 'Помощь'],
  },
  { label: 'Профиль', icon: User, children: ['Настройки'] },
]

/** Три таба нижней навигации — как в BottomNav.tsx */
export const mockBottomNav = [
  { label: 'Главная', icon: LayoutDashboard, active: true },
  { label: 'Сервис', icon: Wrench, active: false },
  { label: 'Профиль', icon: User, active: false },
]

export const mockPeriods = [
  { label: 'Месяц', active: true },
  { label: 'Полгода', active: false },
  { label: 'Год', active: false },
]

export const mockMileageHistory = [
  { mileage: '87 420', meta: '20 июл. · Через Telegram' },
  { mileage: '86 940', meta: '12 июл. · Обслуживание: Замена масла' },
  { mileage: '86 510', meta: '4 июл. · Поездка в Казань' },
]

/**
 * Цвета статусов — light-значения токенов --status-* из globals.css,
 * переведённые в hex, потому что лендинг живёт на захардкоженной палитре.
 */
export const statusColor = {
  ok: '#1DAF53',
  soon: '#DC8F09',
  critical: '#DC2828',
} as const

/** hsl(217 91% 55%) — токен --chart-line */
export const chartColor = '#2474F5'

export interface MockMaintenanceItem {
  title: string
  remaining: string
  status: keyof typeof statusColor
  statusLabel: string
  usedPercent: number
}

export const mockMaintenance: MockMaintenanceItem[] = [
  {
    title: 'Замена масла',
    remaining: 'Осталось 2 300 км · 24 дн.',
    status: 'soon',
    statusLabel: 'Скоро',
    usedPercent: 78,
  },
  {
    title: 'Тормозные колодки',
    remaining: 'Осталось 12 100 км · 8 мес.',
    status: 'ok',
    statusLabel: 'OK',
    usedPercent: 34,
  },
  {
    title: 'Воздушный фильтр',
    remaining: 'Просрочено на 420 км',
    status: 'critical',
    statusLabel: 'Критично',
    usedPercent: 100,
  },
]

export const mockSpending = {
  total: '12 400 ₽',
  period: 'За месяц',
  items: [
    { label: 'Замена масла', amount: '4 800 ₽', height: 100 },
    { label: 'Колодки', amount: '3 900 ₽', height: 81 },
    { label: 'Фильтры', amount: '2 100 ₽', height: 44 },
    { label: 'Мойка', amount: '1 600 ₽', height: 33 },
  ],
}

/**
 * Точки линии пробега: восходящий тренд, viewBox 0 0 280 44.
 * Координаты с отступом от краёв — иначе крайние точки обрезаются рамкой svg.
 */
export const mileageChartPoints = [
  { x: 8, y: 36 },
  { x: 46, y: 32 },
  { x: 84, y: 29 },
  { x: 122, y: 24 },
  { x: 160, y: 20 },
  { x: 198, y: 15 },
  { x: 236, y: 11 },
  { x: 272, y: 8 },
]

export const mileageChartPolyline = mileageChartPoints.map((p) => `${p.x},${p.y}`).join(' ')
