'use client'

import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * A password field with a reveal toggle. Everything but the wrapper is the plain
 * `Input`, so `FormControl` can keep cloning `id`/`aria-*` onto the real control:
 * the extra props land on the input, never on the positioning div.
 */
function PasswordInput({ className, ...props }: React.ComponentProps<'input'>) {
  const [visible, setVisible] = React.useState(false)

  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className={cn('pr-9', className)} {...props} />
      <Button
        // The toggle sits inside a form, where an untyped button submits it.
        type="button"
        // Deliberately left in the tab order: it is the only way to reveal the
        // password, so taking it out would make the feature unreachable for
        // anyone filling the form from the keyboard. The cost is one extra Tab
        // between the password and the next field.
        variant="ghost"
        size="icon-xs"
        aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1 -translate-y-1/2"
      >
        {visible ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  )
}

export { PasswordInput }
