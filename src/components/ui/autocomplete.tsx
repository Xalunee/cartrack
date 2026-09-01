"use client"

import * as React from "react"
import { Autocomplete as AutocompletePrimitive } from "@base-ui/react/autocomplete"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

function Autocomplete({
  ...props
}: React.ComponentProps<typeof AutocompletePrimitive.Root>) {
  return <AutocompletePrimitive.Root data-slot="autocomplete" {...props} />
}

/**
 * Rendered through the plain `Input` so a field that suggests and a field that
 * does not look identical — the styling has one home, not two.
 */
function AutocompleteInput({
  className,
  onFocus,
  onMouseUp,
  ...props
}: AutocompletePrimitive.Input.Props) {
  const selectOnRelease = React.useRef(false)

  return (
    <AutocompletePrimitive.Input
      data-slot="autocomplete-input"
      render={<Input />}
      className={cn(className)}
      {...props}
      onFocus={(event) => {
        // Focusing a field that already holds a value selects it, so the next
        // keystroke replaces what is there instead of appending to it: «Kia» plus
        // a typed «Toy» filters to nothing and reads as a broken list.
        event.currentTarget.select()
        selectOnRelease.current = true
        onFocus?.(event)
      }}
      onMouseUp={(event) => {
        // Only the release that ends the focusing click, which would otherwise
        // collapse that selection back to a caret. Every later click keeps its
        // default, or the caret could never be placed inside the text again and
        // the next keystroke would wipe the whole field.
        if (selectOnRelease.current) {
          selectOnRelease.current = false
          event.preventDefault()
        }
        onMouseUp?.(event)
      }}
    />
  )
}

function AutocompleteContent({
  className,
  sideOffset = 4,
  align,
  side,
  ...props
}: AutocompletePrimitive.Popup.Props &
  Pick<AutocompletePrimitive.Positioner.Props, "sideOffset" | "align" | "side">) {
  return (
    <AutocompletePrimitive.Portal>
      <AutocompletePrimitive.Positioner
        className="isolate z-50 outline-none"
        sideOffset={sideOffset}
        align={align}
        side={side}
      >
        {/* Capped well under the space available: the full brand list is 50-odd
            rows, and letting it run the height of a phone screen buries the
            field being filled in and the one next to it. */}
        <AutocompletePrimitive.Popup
          data-slot="autocomplete-content"
          className={cn(
            "z-50 max-h-[min(16rem,var(--available-height))] w-(--anchor-width) origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        />
      </AutocompletePrimitive.Positioner>
    </AutocompletePrimitive.Portal>
  )
}

function AutocompleteList({
  className,
  ...props
}: AutocompletePrimitive.List.Props) {
  return (
    <AutocompletePrimitive.List
      data-slot="autocomplete-list"
      className={cn("outline-none", className)}
      {...props}
    />
  )
}

function AutocompleteItem({
  className,
  ...props
}: AutocompletePrimitive.Item.Props) {
  return (
    <AutocompletePrimitive.Item
      data-slot="autocomplete-item"
      className={cn(
        // Roomier than a menu row on purpose: this list is scrolled with a thumb
        // on a phone, where a 24px row is a coin toss between two models.
        "relative flex min-h-9 cursor-default items-center rounded-md px-2 py-1.5 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

function AutocompleteEmpty({
  className,
  ...props
}: AutocompletePrimitive.Empty.Props) {
  return (
    <AutocompletePrimitive.Empty
      data-slot="autocomplete-empty"
      className={cn(
        "px-2 py-1.5 text-sm text-muted-foreground empty:m-0 empty:p-0",
        className
      )}
      {...props}
    />
  )
}

export {
  Autocomplete,
  AutocompleteInput,
  AutocompleteContent,
  AutocompleteList,
  AutocompleteItem,
  AutocompleteEmpty,
}
