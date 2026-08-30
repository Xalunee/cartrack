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
      <Input type={visible ? 'text' : 'password'} className={cn('pr-10', className)} {...props} />
      {/* Positioning lives on the wrapper, not the Button: the Button's base classes
          include active:translate-y-px, and a centring -translate-y-1/2 on the same
          element would be overwritten wholesale on :active, dropping the button 15px
          out from under the cursor and swallowing the click. */}
      <span className="absolute top-1/2 right-0.5 flex -translate-y-1/2">
        <Button
          // The toggle sits inside a form, where an untyped button submits it.
          type="button"
          // Deliberately left in the tab order: it is the only way to reveal the
          // password, so taking it out would make the feature unreachable for
          // anyone filling the form from the keyboard. The cost is one extra Tab
          // between the password and the next field.
          variant="ghost"
          size="icon-sm"
          aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
          className={cn(
            'text-muted-foreground hover:text-foreground relative',
            // The field is only 32px tall, so the button itself cannot be 44px
            // without dwarfing the input it sits in. The visible control stays
            // 28px and an invisible ::after pad, sized outright rather than by
            // inset (which would resolve against the padding box and land a
            // pixel short), centres a 44x44 hit area on it — the minimum
            // comfortable phone tap target. The 8px it gains on the left stays
            // inside the pr-10 padding we reserve, so it never steals a click
            // meant for the text.
            "after:absolute after:top-1/2 after:left-1/2 after:size-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']"
          )}
        >
          {visible ? <EyeOff /> : <Eye />}
        </Button>
      </span>
    </div>
  )
}

export { PasswordInput }
