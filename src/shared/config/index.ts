export const APP_CONFIG = {
  name: 'CarTrack',
  description: 'Трекер обслуживания автомобиля',
  defaultMileageInterval: 7,
} as const

export const MAINTENANCE_STATUS = {
  OK: 'ok',
  SOON: 'soon',
  CRITICAL: 'critical',
} as const

export type MaintenanceStatus = (typeof MAINTENANCE_STATUS)[keyof typeof MAINTENANCE_STATUS]
