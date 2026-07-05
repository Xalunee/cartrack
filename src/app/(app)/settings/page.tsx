'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { MessageCircle, Copy, Check, Unlink, LogOut, Download, Share, Menu } from 'lucide-react'
import { apiClient } from '@shared/api/client'
import { signOut } from 'next-auth/react'

interface UserInfo {
  id: string
  email: string
  name: string | null
  telegramChatId: string | null
  mileageTrackInterval: number
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [linkCode, setLinkCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isSamsung, setIsSamsung] = useState(false)

  useEffect(() => {
    apiClient<UserInfo>('/api/user')
      .then(setUser)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent))
    setIsSamsung(/SamsungBrowser/.test(navigator.userAgent))
  }, [])

  async function generateCode() {
    setIsPending(true)
    try {
      const res = await apiClient<{ code: string }>('/api/telegram/generate-code', {
        method: 'POST',
      })
      setLinkCode(res.code)
    } catch (e) {
      console.error(e)
    } finally {
      setIsPending(false)
    }
  }

  async function unlinkTelegram() {
    setIsPending(true)
    try {
      await apiClient('/api/telegram/unlink', { method: 'POST' })
      setUser((prev) => prev ? { ...prev, telegramChatId: null } : null)
      setLinkCode(null)
    } catch (e) {
      console.error(e)
    } finally {
      setIsPending(false)
    }
  }

  function copyCode() {
    if (linkCode) {
      navigator.clipboard.writeText(linkCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 py-6 space-y-5 page-enter">
        <div className="h-7 w-32 skeleton" />
        <div className="h-40 skeleton rounded-xl" />
        <div className="h-48 skeleton rounded-xl" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 py-6 space-y-5 page-enter">
      <div className="mb-5">
        <h1 className="text-lg font-semibold tracking-tight">Настройки</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Аккаунт</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>{user?.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Имя</span>
            <span>{user?.name ?? '-'}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Telegram
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.telegramChatId ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: 'hsl(var(--status-ok))' }} />
                <span className="text-sm">Telegram привязан</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={unlinkTelegram}
                disabled={isPending}
              >
                <Unlink className="h-3.5 w-3.5 mr-1" />
                Отвязать
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Привяжите Telegram чтобы получать напоминания и вносить пробег через бота.
              </p>

              {linkCode ? (
                <div className="space-y-2">
                  <p className="text-sm">Ваш код привязки:</p>
                  <div className="flex items-center gap-2">
                    <code className="text-2xl font-mono font-bold tracking-widest bg-muted px-4 py-2 rounded-lg">
                      {linkCode}
                    </code>
                    <Button variant="ghost" size="sm" onClick={copyCode}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Отправьте этот код боту командой: /link {linkCode}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Код действует 10 минут.
                  </p>
                </div>
              ) : (
                <Button onClick={generateCode} disabled={isPending} size="sm">
                  <MessageCircle className="h-3.5 w-3.5 mr-1" />
                  {isPending ? 'Генерация...' : 'Получить код привязки'}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {!isStandalone && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="h-4 w-4" />
              Установить приложение
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isIOS ? (
              <p className="text-sm text-muted-foreground">
                Нажмите <Share className="inline h-4 w-4 mx-0.5" /> внизу экрана в Safari, затем «На экран Домой».
                CarTrack появится как обычное приложение на главном экране.
              </p>
            ) : isSamsung ? (
              <p className="text-sm text-muted-foreground">
                Нажмите <Menu className="inline h-4 w-4 mx-0.5" /> внизу справа,
                затем «Добавить страницу к» → «Главный экран». CarTrack появится на главном экране.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Нажмите ⋮ в браузере, затем «Установить приложение».
                CarTrack появится на главном экране.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Separator />

      <Button
        variant="outline"
        className="w-full"
        onClick={async () => { await signOut({ redirect: false }); router.push('/login') }}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Выйти
      </Button>
    </div>
  )
}
