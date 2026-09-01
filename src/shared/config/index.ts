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

/**
 * Summary of the fallback disclosure on the settings Telegram card. The bot quotes
 * it when telling users where the manual /link command lives, so the label has to
 * be one value — renaming it in only one of the two places sends people looking
 * for a heading that no longer exists.
 */
export const TELEGRAM_FALLBACK_LABEL = 'Не открылся Telegram?'

/**
 * Rejection of the current password on a password change. The settings form puts
 * this one failure on the field instead of above the form, and it recognises it
 * by the message — so both sides read the wording from here, or a reword in the
 * route silently moves the error away from the field it belongs to.
 */
export const WRONG_PASSWORD_MESSAGE = 'Неверный текущий пароль'
