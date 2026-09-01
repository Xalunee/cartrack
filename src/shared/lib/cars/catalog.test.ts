import { describe, it, expect } from 'vitest'
import {
  CAR_BRANDS,
  CAR_BRAND_NAMES,
  findBrand,
  findModel,
  matchesQuery,
  modelsForBrand,
} from './catalog'

describe('car catalog', () => {
  it('lists every brand exactly once', () => {
    expect(CAR_BRAND_NAMES).toHaveLength(CAR_BRANDS.length)
    expect(new Set(CAR_BRAND_NAMES).size).toBe(CAR_BRANDS.length)
  })

  it('sorts the brand list alphabetically', () => {
    const sorted = CAR_BRAND_NAMES.slice().sort((a, b) => a.localeCompare(b, 'ru'))
    expect(CAR_BRAND_NAMES).toEqual(sorted)
  })

  it('gives every brand at least one model', () => {
    const empty = CAR_BRANDS.filter((brand) => brand.models.length === 0)
    expect(empty).toEqual([])
  })

  // Every name and alias share one lookup table, so a collision would silently
  // hand one brand's key to another and break the first one's model list.
  it('has no name or alias shared between two brands', () => {
    const norm = (value: string) => value.toLowerCase().replace(/[\s\-_.]/g, '')
    const owners = new Map<string, string>()
    const collisions: string[] = []
    for (const brand of CAR_BRANDS) {
      for (const key of [brand.name, ...(brand.aliases ?? [])]) {
        const owner = owners.get(norm(key))
        if (owner !== undefined && owner !== brand.name) collisions.push(`${key}: ${owner} / ${brand.name}`)
        owners.set(norm(key), brand.name)
      }
    }
    expect(collisions).toEqual([])
  })

  it('has no duplicate models inside a brand', () => {
    for (const brand of CAR_BRANDS) {
      expect(new Set(brand.models).size).toBe(brand.models.length)
    }
  })
})

describe('findBrand', () => {
  it('finds a brand however it is capitalised or spaced', () => {
    expect(findBrand('mercedes benz')?.name).toBe('Mercedes-Benz')
    expect(findBrand('LAND-ROVER')?.name).toBe('Land Rover')
  })

  it('finds a brand by its Russian name', () => {
    expect(findBrand('Тойота')?.name).toBe('Toyota')
    expect(findBrand('ваз')?.name).toBe('Lada')
  })

  it('returns nothing for a brand outside the catalog', () => {
    expect(findBrand('Wartburg')).toBeUndefined()
  })
})

describe('modelsForBrand', () => {
  it('narrows the models to the brand', () => {
    expect(modelsForBrand('Toyota')).toContain('Camry')
    expect(modelsForBrand('Toyota')).not.toContain('Solaris')
  })

  it('follows an alias to the same models', () => {
    expect(modelsForBrand('Лада')).toEqual(modelsForBrand('Lada'))
  })

  // Suggesting Camry to someone who typed a name we have never seen would be
  // worse than suggesting nothing.
  it('suggests nothing for an unknown brand', () => {
    expect(modelsForBrand('Wartburg')).toEqual([])
  })
})

describe('matchesQuery', () => {
  it('matches anything on an empty query', () => {
    expect(matchesQuery('Toyota', '')).toBe(true)
  })

  it('matches on a fragment from the middle of the name', () => {
    expect(matchesQuery('Mercedes-Benz', 'benz')).toBe(true)
  })

  it('ignores case, spaces and hyphens', () => {
    expect(matchesQuery('Land Rover', 'landrover')).toBe(true)
    expect(matchesQuery('Mercedes-Benz', 'mercedes benz')).toBe(true)
  })

  it('matches a brand typed in Russian', () => {
    expect(matchesQuery('Toyota', 'тойо')).toBe(true)
    expect(matchesQuery('Lada', 'ваз')).toBe(true)
  })

  it('does not match an unrelated query', () => {
    expect(matchesQuery('Toyota', 'ваз')).toBe(false)
  })

  // Aliases belong to brands; a model named like another brand's alias must not
  // drag it into the list.
  it('matches a model only on the model name', () => {
    expect(matchesQuery('Camry', 'тойо')).toBe(false)
  })
})

describe('findModel', () => {
  it('finds a model however it is capitalised or spaced', () => {
    expect(findModel('Kia', 'rio x-line')).toBe('Rio X-Line')
    expect(findModel('Toyota', 'landcruiser')).toBe('Land Cruiser')
  })

  it('follows a brand alias to the same models', () => {
    expect(findModel('Тойота', 'camry')).toBe('Camry')
  })

  it('will not take a model from another brand', () => {
    expect(findModel('Kia', 'Camry')).toBeUndefined()
  })

  it('returns nothing for a model outside the catalog', () => {
    expect(findModel('Toyota', 'Кит-кар 3000')).toBeUndefined()
  })
})
