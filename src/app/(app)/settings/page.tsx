'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MessageCircle, Copy, Check, Unlink, LogOut, Download, Share, Menu, FileText, ShieldAlert, ExternalLink } from 'lucide-react'
import { apiClient } from '@shared/api/client'
import { signOut } from 'next-auth/react'
import { ExportButton } from '@features/export-pdf'
import { useCarQuery, useUpdateCarMutation } from '@entities/car'
import { StsDialog } from '@features/set-sts'
import { useHydrated, useMediaQuery } from '@shared/lib/client-env'
import { TELEGRAM_FALLBACK_LABEL } from '@shared/config'

interface UserInfo {
  id: string
  email: string
  name: string | null
  telegramChatId: string | null
  mileageTrackInterval: number
}

interface TelegramLink {
  token: string
  /** Public @username of the bot, so the manual fallback can name where to paste. */
  botUsername: string
  url: string
}

// Linking finishes in Telegram, so the page has no event to wait on — it polls
// until the webhook has stored the chat id, then gives up rather than spinning.
// The token outlives this window, so giving up is not the same as failing.
const LINK_POLL_INTERVAL_MS = 3000
const LINK_POLL_TIMEOUT_MS = 2 * 60 * 1000

type LinkStatus = 'idle' | 'waiting' | 'timedout'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [link, setLink] = useState<TelegramLink | null>(null)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [linkStatus, setLinkStatus] = useState<LinkStatus>('idle')
  const [popupBlocked, setPopupBlocked] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [confirmingStsDelete, setConfirmingStsDelete] = useState(false)

  // Install hints depend on the browser, so they can only be known client-side.
  const hydrated = useHydrated()
  const isStandalone = useMediaQuery('(display-mode: standalone)')
  const isIOS = hydrated && /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isSamsung = hydrated && /SamsungBrowser/.test(navigator.userAgent)

  const { data: car } = useCarQuery()
  const updateCarMutation = useUpdateCarMutation()

  function maskSts(sts: string) {
    return '•'.repeat(Math.max(sts.length - 4, 0)) + sts.slice(-4)
  }

  useEffect(() => {
    apiClient<UserInfo>('/api/user')
      .then(setUser)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (linkStatus !== 'waiting') return

    const startedAt = Date.now()
    let stopped = false

    // Every exit goes through here, so a poll and the final check resolving
    // together cannot both apply the transition or leave the interval running.
    function stop() {
      if (stopped) return false
      stopped = true
      clearInterval(timer)
      return true
    }

    async function checkLinked() {
      const fresh = await apiClient<UserInfo>('/api/user')
      if (!fresh.telegramChatId) return false
      if (stop()) {
        setUser(fresh)
        setLink(null)
        setPopupBlocked(false)
        setLinkStatus('idle')
      }
      return true
    }

    const timer = setInterval(async () => {
      if (stopped) return

      if (Date.now() - startedAt > LINK_POLL_TIMEOUT_MS) {
        // One last look before giving up: the token stays valid well past the
        // polling window, so the link may have gone through a moment ago.
        try {
          if (await checkLinked()) return
        } catch {
          // Treat an unreachable API as "not linked yet" and fall through.
        }
        if (stop()) setLinkStatus('timedout')
        return
      }

      try {
        await checkLinked()
      } catch {
        // A failed poll is not a failed link — keep waiting for the next tick.
      }
    }, LINK_POLL_INTERVAL_MS)

    return () => {
      stopped = true
      clearInterval(timer)
    }
  }, [linkStatus])

  async function startLinking() {
    setIsPending(true)
    setLinkError(null)

    // Opened synchronously inside the click: after an await the tap's transient
    // user activation is spent and Safari refuses the popup outright.
    const popup = window.open('', '_blank')

    try {
      const res = await apiClient<TelegramLink>('/api/telegram/generate-code', {
        method: 'POST',
      })
      if (popup) popup.location.href = res.url
      setLink(res)
      setPopupBlocked(!popup)
      setLinkStatus('waiting')
    } catch (e) {
      popup?.close()
      setLink(null)
      setPopupBlocked(false)
      setLinkStatus('idle')
      setLinkError(e instanceof Error ? e.message : 'Не удалось создать ссылку привязки')
    } finally {
      setIsPending(false)
    }
  }

  async function unlinkTelegram() {
    setIsPending(true)
    try {
      await apiClient('/api/telegram/unlink', { method: 'POST' })
      setUser((prev) => prev ? { ...prev, telegramChatId: null } : null)
      setLink(null)
      setPopupBlocked(false)
      setLinkStatus('idle')
    } catch (e) {
      console.error(e)
    } finally {
      setIsPending(false)
    }
  }

  function copyLinkCommand() {
    if (link) {
      // The bot only reads this as a command with the /link prefix — a bare token
      // falls through to the mileage handler.
      navigator.clipboard.writeText(`/link ${link.token}`)
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

              <Button onClick={startLinking} disabled={isPending} size="sm">
                <MessageCircle className="h-3.5 w-3.5 mr-1" />
                {isPending ? 'Открываем Telegram...' : 'Привязать Telegram'}
              </Button>

              {linkError && <p className="text-sm text-destructive">{linkError}</p>}

              {link && (
                <div className="space-y-2">
                  {popupBlocked ? (
                    <p className="text-sm text-muted-foreground">
                      Браузер заблокировал новое окно. Откройте бота по ссылке ниже —
                      привязка сработает так же.
                    </p>
                  ) : linkStatus === 'waiting' ? (
                    <p className="text-sm text-muted-foreground">
                      Ждём подтверждения из Telegram — нажмите «Запустить» в открывшемся чате.
                      Страница обновится сама.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Пока не видим подтверждения. Ссылка действует ещё около 15 минут —
                      завершите привязку в Telegram и обновите страницу.
                    </p>
                  )}

                  <details open={popupBlocked} className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer select-none">{TELEGRAM_FALLBACK_LABEL}</summary>
                    <div className="mt-2 space-y-2">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Открыть @{link.botUsername} в Telegram
                      </a>
                      <p>
                        Или найдите бота{' '}
                        <code className="font-mono bg-muted px-1.5 py-0.5 rounded select-all">
                          @{link.botUsername}
                        </code>{' '}
                        в Telegram и отправьте ему эту команду:
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="font-mono bg-muted px-2 py-1 rounded break-all">
                          /link {link.token}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={copyLinkCommand}
                          title="Скопировать команду целиком"
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p>{copied ? 'Команда скопирована целиком — вставьте её в чат.' : 'Кнопка копирует команду вместе с /link.'}</p>
                      <p>Ссылка действует 15 минут.</p>
                    </div>
                  </details>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            СТС
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {car?.stsNumber ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Номер</span>
                <span className="font-mono">{maskSts(car.stsNumber)}</span>
              </div>
              <div className="flex gap-2">
                <StsDialog
                  currentValue={car.stsNumber}
                  trigger={<Button variant="outline" size="sm">Изменить</Button>}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmingStsDelete(true)}
                >
                  Удалить
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Укажите СТС, чтобы CarTrack мог проверять штрафы ГИБДД.
              </p>
              <StsDialog trigger={<Button size="sm">Указать СТС</Button>} />
            </>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Экспорт данных
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Скачайте полную историю обслуживания в PDF — удобно показать покупателю при продаже машины.
          </p>
          <ExportButton />
        </CardContent>
      </Card>

      <Separator />

      <Button
        variant="outline"
        className="w-full"
        onClick={async () => { await signOut({ redirect: false }); router.push('/login') }}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Выйти
      </Button>

      <AlertDialog open={confirmingStsDelete} onOpenChange={setConfirmingStsDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить СТС?</AlertDialogTitle>
            <AlertDialogDescription>
              Проверка штрафов будет отключена. Историю уже найденных штрафов это не затронет.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                updateCarMutation.mutate({ stsNumber: '' })
                setConfirmingStsDelete(false)
              }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
