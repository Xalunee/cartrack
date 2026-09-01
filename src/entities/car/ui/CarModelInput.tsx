'use client'

import * as React from 'react'

import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
} from '@/components/ui/autocomplete'
import { catalogFilter, findModel, modelsForBrand } from '@shared/lib/cars/catalog'

interface CarModelInputProps
  extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange'> {
  value: string
  onValueChange: (value: string) => void
  /** Whatever is currently in the brand field — the model list follows it. */
  brand: string
}

/**
 * Suggestions narrow to the brand beside it, and only to a brand the catalog
 * recognises: offering Camry to someone who typed a name we have never seen
 * would be worse than offering nothing. Free text is always accepted.
 */
export function CarModelInput({
  value,
  onValueChange,
  brand,
  ...props
}: CarModelInputProps) {
  const models = React.useMemo(() => modelsForBrand(brand), [brand])

  return (
    <Autocomplete
      items={models}
      value={value}
      onValueChange={onValueChange}
      filter={catalogFilter}
      openOnInputClick
    >
      <AutocompleteInput
        placeholder="Camry"
        autoComplete="off"
        {...props}
        onBlur={(event) => {
          const known = findModel(brand, event.currentTarget.value)
          if (known && known !== event.currentTarget.value) onValueChange(known)
          props.onBlur?.(event)
        }}
      />
      <AutocompleteContent>
        <AutocompleteList>
          {(model: string) => (
            <AutocompleteItem key={model} value={model}>
              {model}
            </AutocompleteItem>
          )}
        </AutocompleteList>
        {/* An empty brand and an unrecognised one both leave the list empty, and
            telling them apart is the difference between «fill the brand in» and
            «type your own». */}
        <AutocompleteEmpty>
          {brand.trim() === ''
            ? 'Сначала укажите марку — модели подставятся сами'
            : models.length === 0
              ? 'Моделей этой марки нет в списке — впишите свою'
              : 'Нет в списке — впишите модель сами'}
        </AutocompleteEmpty>
      </AutocompleteContent>
    </Autocomplete>
  )
}
