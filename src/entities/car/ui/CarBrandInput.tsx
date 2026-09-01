'use client'

import type * as React from 'react'

import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
} from '@/components/ui/autocomplete'
import { CAR_BRAND_NAMES, catalogFilter, findBrand } from '@shared/lib/cars/catalog'

interface CarBrandInputProps
  extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange'> {
  value: string
  onValueChange: (value: string) => void
}

/**
 * The catalog is a shortcut, not a whitelist — the field stays a plain text
 * input underneath, so a brand the list has never heard of is typed and saved
 * exactly as before.
 */
export function CarBrandInput({ value, onValueChange, ...props }: CarBrandInputProps) {
  return (
    <Autocomplete
      items={CAR_BRAND_NAMES}
      value={value}
      onValueChange={onValueChange}
      filter={catalogFilter}
      // Tapping the field is how someone browses on a phone: there is no hover
      // to hint that a list exists, so the list has to show itself.
      openOnInputClick
    >
      <AutocompleteInput
        placeholder="Toyota"
        autoComplete="off"
        {...props}
        onBlur={(event) => {
          // Searching in Cyrillic is the point of the aliases, but «тойота» is
          // not what should end up on the car — a brand the catalog recognises
          // is stored the catalog's way, however it was reached.
          const known = findBrand(event.currentTarget.value)
          if (known && known.name !== event.currentTarget.value) onValueChange(known.name)
          props.onBlur?.(event)
        }}
      />
      <AutocompleteContent>
        <AutocompleteList>
          {(brand: string) => (
            <AutocompleteItem key={brand} value={brand}>
              {brand}
            </AutocompleteItem>
          )}
        </AutocompleteList>
        <AutocompleteEmpty>Нет в списке — впишите марку сами</AutocompleteEmpty>
      </AutocompleteContent>
    </Autocomplete>
  )
}
