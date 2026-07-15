'use client'

import { useRouter } from 'next/navigation'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 page-enter">
      <Card className="glass w-full max-w-sm text-center">
        <CardContent className="pt-8 pb-6">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Compass className="h-7 w-7 text-muted-foreground" />
          </div>
          <h1 className="text-lg font-semibold mb-2">Страница не найдена</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Возможно, ссылка устарела или страница была удалена.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push('/dashboard')}>На главную</Button>
            <Button variant="ghost" onClick={() => router.back()}>
              Назад
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
