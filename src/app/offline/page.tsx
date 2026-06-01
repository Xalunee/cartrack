'use client'

import { WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 page-enter">
      <Card className="glass w-full max-w-sm text-center">
        <CardContent className="pt-8 pb-6">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <WifiOff className="h-7 w-7 text-muted-foreground" />
          </div>
          <h1 className="text-lg font-semibold mb-2">Нет подключения</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Проверьте интернет-соединение и попробуйте снова.
            Если вы уже открывали CarTrack, часть данных может быть доступна из кеша.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Повторить
            </Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              Назад
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
