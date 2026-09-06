'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { parseFuelReceiptQr, type FuelReceiptQr } from '@shared/lib/fuel-receipt-qr'
import { createQrDecoder } from '../model/qrDetector'

/** How often a frame is read. Faster than this only heats the phone. */
const FRAME_INTERVAL_MS = 250

/**
 * How long to scan before saying it is not working. Long enough not to nag
 * someone still aiming at the receipt, short enough that a code the camera
 * cannot resolve does not leave them staring at a live picture forever.
 */
const NO_LUCK_AFTER_MS = 15_000

type Problem = 'permission' | 'no-camera' | 'decoder' | 'unknown' | 'not-a-receipt' | 'no-luck'

const PROBLEM_TEXT: Record<Problem, string> = {
  permission: 'Доступ к камере не разрешён — заполните форму вручную.',
  'no-camera': 'Камера недоступна — заполните форму вручную.',
  decoder: 'Этот браузер не умеет читать QR — заполните форму вручную.',
  unknown: 'Не удалось включить камеру — заполните форму вручную.',
  'not-a-receipt': 'Это не похоже на чек. Наведите ещё раз или заполните форму вручную.',
  'no-luck': 'Пока не читается — поднесите ближе, добавьте света или заполните форму вручную.',
}

/** getUserMedia's failure names, translated into what the user can do about it. */
function classify(error: unknown): Problem {
  const name = error instanceof Error ? error.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'permission'
  if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'NotReadableError') {
    return 'no-camera'
  }
  return 'unknown'
}

interface ReceiptScannerProps {
  onScanned: (receipt: FuelReceiptQr) => void
}

/**
 * Scanning the receipt QR. It fills the form in — it does not replace it, and it
 * is not a gate in front of it: every way this can fail ends in one line of text
 * and a form that was working the whole time.
 */
export function ReceiptScanner({ onScanned }: ReceiptScannerProps) {
  const [active, setActive] = useState(false)
  const [problem, setProblem] = useState<Problem | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Read by the frame loop, which must see the current callback without being
  // restarted every time the parent re-renders and hands it a new one.
  const onScannedRef = useRef(onScanned)
  useEffect(() => {
    onScannedRef.current = onScanned
  }, [onScanned])

  const stop = useCallback(() => setActive(false), [])

  useEffect(() => {
    if (!active) return

    let stream: MediaStream | null = null
    let frameTimer: ReturnType<typeof setInterval> | null = null
    let noLuckTimer: ReturnType<typeof setTimeout> | null = null
    let cancelled = false
    let reading = false

    /**
     * Every failure here is reported after an await, and by then the scan may
     * already have been cancelled — a tap on «Отмена» or a navigation. Saying
     * «не удалось включить камеру» about a camera the user themselves closed is
     * a lie, so a cancelled run reports nothing.
     */
    function fail(problem: Problem) {
      if (cancelled) return
      setProblem(problem)
      setActive(false)
    }

    async function run() {
      if (!navigator.mediaDevices?.getUserMedia) {
        // Also the state of any non-HTTPS origin: the API is simply absent there.
        fail('no-camera')
        return
      }

      let opened: MediaStream
      try {
        opened = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
        })
      } catch (error) {
        fail(classify(error))
        return
      }

      // Cleanup can already have run while the permission prompt was on screen —
      // a tap on «Отмена», or leaving the page. It saw `stream` still null and
      // stopped nothing, so this is the only place left that can close the
      // camera the user has just been granted. Without it the phone's camera
      // indicator stays lit until the tab reloads.
      if (cancelled) {
        opened.getTracks().forEach((track) => track.stop())
        return
      }

      stream = opened

      const video = videoRef.current
      if (!video) return

      video.srcObject = stream
      try {
        await video.play()
      } catch {
        fail('unknown')
        return
      }

      const decode = await createQrDecoder()
      if (cancelled) return
      if (!decode) {
        fail('decoder')
        return
      }

      noLuckTimer = setTimeout(() => setProblem('no-luck'), NO_LUCK_AFTER_MS)

      frameTimer = setInterval(async () => {
        // A frame still being decoded must not be joined by the next one: the
        // JavaScript decoder can take longer than the interval on a slow phone,
        // and the queue would grow until the tab stalls.
        if (reading || cancelled || !videoRef.current) return
        reading = true
        try {
          const raw = await decode(videoRef.current)
          if (!raw || cancelled) return

          const receipt = parseFuelReceiptQr(raw)
          if (!receipt) {
            // A readable code that is not a receipt — a promo link on the same
            // slip, say. Keep scanning; the receipt code may still be in frame.
            setProblem('not-a-receipt')
            return
          }

          setProblem(null)
          setActive(false)
          onScannedRef.current(receipt)
        } catch {
          // One unreadable frame is not a failure — the next one may be fine.
        } finally {
          reading = false
        }
      }, FRAME_INTERVAL_MS)
    }

    run()

    return () => {
      cancelled = true
      if (frameTimer) clearInterval(frameTimer)
      if (noLuckTimer) clearTimeout(noLuckTimer)
      // The camera light stays on until every track is stopped, whatever ended
      // the scan — a result, the cancel button, or leaving the page.
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [active])

  return (
    <div className="space-y-2">
      {active ? (
        <div className="relative overflow-hidden rounded-xl border bg-black">
          <video ref={videoRef} className="h-56 w-full object-cover" muted playsInline />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-32 w-32 rounded-lg border-2 border-white/70" />
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="absolute top-2 right-2"
            onClick={stop}
          >
            <X className="h-4 w-4" /> Отмена
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            setProblem(null)
            setActive(true)
          }}
        >
          <Camera className="mr-2 h-4 w-4" /> Сканировать QR с чека
        </Button>
      )}

      {problem && <p className="text-muted-foreground text-xs">{PROBLEM_TEXT[problem]}</p>}
    </div>
  )
}
