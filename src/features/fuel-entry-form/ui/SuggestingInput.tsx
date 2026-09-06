'use client'

import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
} from '@/components/ui/autocomplete'

interface SuggestingInputProps {
  items: string[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  emptyText: string
}

/**
 * A free-text field with a shortcut list — the same shape as the car brand and
 * model inputs, over a plain list of strings instead of a catalog. The list is
 * never a whitelist: anything typed is kept exactly as typed.
 */
export function SuggestingInput({
  items,
  value,
  onValueChange,
  placeholder,
  emptyText,
}: SuggestingInputProps) {
  return (
    <Autocomplete items={items} value={value} onValueChange={onValueChange} openOnInputClick>
      <AutocompleteInput placeholder={placeholder} autoComplete="off" />
      <AutocompleteContent>
        <AutocompleteList>
          {(item: string) => (
            <AutocompleteItem key={item} value={item}>
              {item}
            </AutocompleteItem>
          )}
        </AutocompleteList>
        <AutocompleteEmpty>{emptyText}</AutocompleteEmpty>
      </AutocompleteContent>
    </Autocomplete>
  )
}
