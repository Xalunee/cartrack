'use client'

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 text-4xl">🚗</div>
      <h1 className="mb-2 text-xl font-semibold">Нет подключения</h1>
      <p className="text-muted-foreground max-w-xs text-sm">
        CarTrack требует интернет для работы. Проверьте подключение и попробуйте снова.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="bg-primary text-primary-foreground mt-6 rounded-full px-6 py-2 text-sm"
      >
        Повторить
      </button>
    </div>
  )
}
