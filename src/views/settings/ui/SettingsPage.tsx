import { UpdateCarForm } from '@features/update-car'
import { ExportButton } from '@features/export-pdf'

export function SettingsPage() {
  return (
    <div className="space-y-6 p-4">
      <h1 className="text-xl font-bold">Настройки</h1>
      <UpdateCarForm />
      <ExportButton />
    </div>
  )
}
