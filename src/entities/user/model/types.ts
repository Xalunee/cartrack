export interface User {
  id: string
  email: string
  name: string | null
  telegramChatId: string | null
  mileageTrackInterval: number
}

export interface UpdateUserDto {
  name?: string
  currentPassword?: string
  newPassword?: string
}
