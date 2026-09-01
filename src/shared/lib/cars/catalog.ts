/**
 * The brand and model lists behind the pickers on the onboarding and car forms.
 *
 * Bundled as data rather than fetched: the app is a PWA that has to work on a
 * phone with no signal, and a picker that needs the network is a picker that
 * stops working exactly when someone is standing in a parking lot adding their
 * car. DaData's `car_brand` suggestions are free but cover brands only — model
 * recognition sits behind the paid «Стандартизация» endpoint, which would put a
 * per-record cost and an external failure point in front of a two-field form.
 *
 * The lists are a convenience, never a gate: both fields accept free text, so a
 * kit car or a brand that arrived in Russia last month is never blocked by an
 * entry missing here.
 */

export interface CarBrand {
  /** Canonical spelling — this is what gets stored on the car. */
  name: string
  /**
   * What people type instead. Russian buyers search in Cyrillic far more often
   * than the Latin badge suggests, and a picker that cannot find «Тойота» reads
   * as broken rather than as Latin-only.
   */
  aliases?: readonly string[]
  models: readonly string[]
}

export const CAR_BRANDS: readonly CarBrand[] = [
  {
    name: 'Audi',
    aliases: ['Ауди'],
    models: ['A1', 'A3', 'A4', 'A4 Allroad', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'TT', 'e-tron'],
  },
  {
    name: 'BMW',
    aliases: ['БМВ'],
    models: ['1 series', '2 series', '3 series', '4 series', '5 series', '6 series', '7 series', '8 series', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z4', 'i3', 'i4', 'iX'],
  },
  {
    name: 'BYD',
    aliases: ['БИД', 'Бид'],
    models: ['Han', 'Song Plus', 'Seal', 'Dolphin', 'Atto 3', 'Tang', 'Qin Plus', 'Yuan Plus'],
  },
  {
    name: 'Belgee',
    aliases: ['Белджи', 'Белджии'],
    models: ['X50', 'X70', 'S50'],
  },
  {
    name: 'Cadillac',
    aliases: ['Кадиллак'],
    models: ['ATS', 'CTS', 'Escalade', 'SRX', 'XT5', 'XT6'],
  },
  {
    name: 'Changan',
    aliases: ['Чанган'],
    models: ['CS35 Plus', 'CS55 Plus', 'CS75 Plus', 'CS85', 'CS95', 'Uni-K', 'Uni-S', 'Uni-T', 'Uni-V', 'Alsvin', 'Eado'],
  },
  {
    name: 'Chery',
    aliases: ['Чери', 'Черри'],
    models: ['Tiggo 2', 'Tiggo 3', 'Tiggo 4', 'Tiggo 4 Pro', 'Tiggo 7', 'Tiggo 7 Pro', 'Tiggo 8', 'Tiggo 8 Pro', 'Tiggo 8 Pro Max', 'Arrizo 8', 'Amulet', 'Bonus', 'Fora', 'QQ'],
  },
  {
    name: 'Chevrolet',
    aliases: ['Шевроле'],
    models: ['Aveo', 'Captiva', 'Cobalt', 'Cruze', 'Epica', 'Lacetti', 'Lanos', 'Malibu', 'Niva', 'Orlando', 'Rezzo', 'Spark', 'Tahoe', 'TrailBlazer'],
  },
  {
    name: 'Chrysler',
    aliases: ['Крайслер'],
    models: ['300C', 'Pacifica', 'PT Cruiser', 'Sebring', 'Voyager'],
  },
  {
    name: 'Citroen',
    aliases: ['Ситроен', 'Citroën'],
    models: ['Berlingo', 'C1', 'C3', 'C4', 'C4 Aircross', 'C4 Picasso', 'C5', 'C5 Aircross', 'DS3', 'DS4', 'Jumpy'],
  },
  {
    name: 'Datsun',
    aliases: ['Датсун'],
    models: ['mi-DO', 'on-DO'],
  },
  {
    name: 'Dodge',
    aliases: ['Додж'],
    models: ['Caliber', 'Challenger', 'Charger', 'Durango', 'Journey', 'Nitro', 'RAM'],
  },
  {
    name: 'Exeed',
    aliases: ['Эксид'],
    models: ['LX', 'TXL', 'VX', 'RX', 'ES'],
  },
  {
    name: 'FAW',
    aliases: ['ФАВ'],
    models: ['Bestune B70', 'Bestune T55', 'Bestune T77', 'Besturn X40', 'Besturn X80'],
  },
  {
    name: 'Fiat',
    aliases: ['Фиат'],
    models: ['500', 'Albea', 'Doblo', 'Ducato', 'Freemont', 'Linea', 'Punto'],
  },
  {
    name: 'Ford',
    aliases: ['Форд'],
    models: ['C-Max', 'EcoSport', 'Edge', 'Escape', 'Explorer', 'Fiesta', 'Focus', 'Fusion', 'Galaxy', 'Kuga', 'Mondeo', 'Mustang', 'Ranger', 'S-Max', 'Transit'],
  },
  {
    name: 'GAC',
    aliases: ['ДЖИЭйСи', 'Гак'],
    models: ['GS3', 'GS4', 'GS5', 'GS8', 'GN8', 'Aion S', 'Aion Y'],
  },
  {
    name: 'GAZ',
    aliases: ['ГАЗ', 'Газель', 'Волга'],
    models: ['Gazelle Next', 'Gazelle Business', 'Sobol', 'Valday', '3110', '31105', '2410', '69'],
  },
  {
    name: 'Geely',
    aliases: ['Джили', 'Джилли'],
    models: ['Atlas', 'Atlas Pro', 'Coolray', 'Emgrand', 'Monjaro', 'Okavango', 'Preface', 'Tugella', 'MK', 'Cityray'],
  },
  {
    name: 'Genesis',
    aliases: ['Генезис'],
    models: ['G70', 'G80', 'G90', 'GV70', 'GV80'],
  },
  {
    name: 'Great Wall',
    aliases: ['Грейт Волл', 'Ховер'],
    models: ['Hover H3', 'Hover H5', 'Hover M4', 'Poer', 'Wingle 5', 'Wingle 7'],
  },
  {
    name: 'Haval',
    aliases: ['Хавал', 'Хавейл'],
    models: ['Dargo', 'F7', 'F7x', 'H3', 'H5', 'H6', 'H9', 'Jolion', 'M6'],
  },
  {
    name: 'Honda',
    aliases: ['Хонда'],
    models: ['Accord', 'Civic', 'CR-V', 'Fit', 'Freed', 'HR-V', 'Insight', 'Jazz', 'Legend', 'Odyssey', 'Pilot', 'Stepwgn', 'Vezel'],
  },
  {
    name: 'Hyundai',
    aliases: ['Хендай', 'Хёндай', 'Хундай'],
    models: ['Accent', 'Creta', 'Elantra', 'Getz', 'Grand Santa Fe', 'i20', 'i30', 'i40', 'ix35', 'Palisade', 'Santa Fe', 'Solaris', 'Sonata', 'Tucson', 'Genesis', 'Starex', 'H-1'],
  },
  {
    name: 'Infiniti',
    aliases: ['Инфинити'],
    models: ['EX', 'FX', 'G', 'JX', 'M', 'Q50', 'Q70', 'QX50', 'QX56', 'QX60', 'QX70', 'QX80'],
  },
  {
    name: 'Jaecoo',
    aliases: ['Джейку', 'Джеку'],
    models: ['J7', 'J8'],
  },
  {
    name: 'Jaguar',
    aliases: ['Ягуар'],
    models: ['E-Pace', 'F-Pace', 'F-Type', 'XE', 'XF', 'XJ'],
  },
  {
    name: 'Jeep',
    aliases: ['Джип'],
    models: ['Cherokee', 'Compass', 'Grand Cherokee', 'Renegade', 'Wrangler'],
  },
  {
    name: 'Jetour',
    aliases: ['Джетур'],
    models: ['Dashing', 'T2', 'X50', 'X70 Plus', 'X90 Plus'],
  },
  {
    name: 'Kia',
    aliases: ['Киа', 'Кия'],
    models: ['Carnival', 'Ceed', 'Cerato', 'K5', 'Mohave', 'Optima', 'Picanto', 'Rio', 'Rio X', 'Rio X-Line', 'Sorento', 'Soul', 'Sportage', 'Seltos', 'Spectra', 'Stinger', 'Venga'],
  },
  {
    name: 'Land Rover',
    aliases: ['Ленд Ровер', 'Ланд Ровер'],
    models: ['Defender', 'Discovery', 'Discovery Sport', 'Freelander', 'Range Rover', 'Range Rover Evoque', 'Range Rover Sport', 'Range Rover Velar'],
  },
  {
    name: 'Lexus',
    aliases: ['Лексус'],
    models: ['ES', 'GS', 'GX', 'IS', 'LS', 'LX', 'NX', 'RX', 'UX', 'RC'],
  },
  {
    name: 'Li Auto',
    aliases: ['Лисян', 'Лиауто', 'Lixiang'],
    models: ['L6', 'L7', 'L8', 'L9', 'One'],
  },
  {
    name: 'Lifan',
    aliases: ['Лифан'],
    models: ['Breez', 'Cebrium', 'Myway', 'Smily', 'Solano', 'X50', 'X60', 'X70'],
  },
  {
    name: 'Mazda',
    aliases: ['Мазда'],
    models: ['2', '3', '5', '6', 'Axela', 'BT-50', 'CX-3', 'CX-30', 'CX-5', 'CX-7', 'CX-9', 'Demio', 'MX-5', 'Premacy'],
  },
  {
    name: 'Mercedes-Benz',
    aliases: ['Мерседес', 'Мерс', 'Mercedes'],
    models: ['A-class', 'B-class', 'C-class', 'CLA', 'CLS', 'E-class', 'G-class', 'GL', 'GLA', 'GLB', 'GLC', 'GLE', 'GLK', 'GLS', 'M-class', 'S-class', 'V-class', 'Sprinter', 'Vito'],
  },
  {
    name: 'Mitsubishi',
    aliases: ['Мицубиси', 'Митсубиси', 'Мицубиши'],
    models: ['ASX', 'Colt', 'Eclipse Cross', 'Galant', 'Lancer', 'L200', 'Outlander', 'Pajero', 'Pajero Sport'],
  },
  {
    name: 'Moskvich',
    aliases: ['Москвич', 'АЗЛК'],
    models: ['3', '3e', '6', '8', '2140', '2141'],
  },
  {
    name: 'Nissan',
    aliases: ['Ниссан'],
    models: ['Almera', 'Juke', 'Leaf', 'March', 'Micra', 'Murano', 'Note', 'Pathfinder', 'Patrol', 'Primera', 'Qashqai', 'Serena', 'Sunny', 'Teana', 'Terrano', 'Tiida', 'X-Trail'],
  },
  {
    name: 'Omoda',
    aliases: ['Омода'],
    models: ['C5', 'S5', 'S5 GT'],
  },
  {
    name: 'Opel',
    aliases: ['Опель'],
    models: ['Antara', 'Astra', 'Corsa', 'Insignia', 'Meriva', 'Mokka', 'Vectra', 'Zafira'],
  },
  {
    name: 'Peugeot',
    aliases: ['Пежо'],
    models: ['206', '207', '208', '301', '307', '308', '408', '2008', '3008', '4008', '5008', 'Boxer', 'Partner'],
  },
  {
    name: 'Porsche',
    aliases: ['Порше'],
    models: ['911', 'Cayenne', 'Cayman', 'Macan', 'Panamera', 'Taycan'],
  },
  {
    name: 'Ravon',
    aliases: ['Равон'],
    models: ['Gentra', 'Nexia R3', 'R2', 'R4'],
  },
  {
    name: 'Renault',
    aliases: ['Рено'],
    models: ['Arkana', 'Captur', 'Duster', 'Fluence', 'Kaptur', 'Koleos', 'Logan', 'Megane', 'Sandero', 'Sandero Stepway', 'Scenic', 'Symbol', 'Kangoo', 'Master'],
  },
  {
    name: 'Skoda',
    aliases: ['Шкода', 'Škoda'],
    models: ['Fabia', 'Kamiq', 'Karoq', 'Kodiaq', 'Octavia', 'Rapid', 'Roomster', 'Superb', 'Yeti'],
  },
  {
    name: 'SsangYong',
    aliases: ['Санг Йонг', 'Ссангйонг'],
    models: ['Actyon', 'Kyron', 'Rexton', 'Stavic', 'Tivoli'],
  },
  {
    name: 'Subaru',
    aliases: ['Субару'],
    models: ['Ascent', 'Forester', 'Impreza', 'Legacy', 'Levorg', 'Outback', 'Tribeca', 'WRX', 'XV'],
  },
  {
    name: 'Suzuki',
    aliases: ['Сузуки', 'Судзуки'],
    models: ['Grand Vitara', 'Jimny', 'Liana', 'Swift', 'SX4', 'Vitara'],
  },
  {
    name: 'Tank',
    aliases: ['Танк'],
    models: ['300', '400', '500', '700'],
  },
  {
    name: 'Tesla',
    aliases: ['Тесла'],
    models: ['Model 3', 'Model S', 'Model X', 'Model Y', 'Cybertruck'],
  },
  {
    name: 'Toyota',
    aliases: ['Тойота'],
    models: ['Auris', 'Avensis', 'Camry', 'Corolla', 'Fortuner', 'Highlander', 'Hilux', 'Land Cruiser', 'Land Cruiser Prado', 'Prius', 'RAV4', 'Vitz', 'Yaris', 'Alphard', 'Crown', 'Mark II'],
  },
  {
    name: 'UAZ',
    aliases: ['УАЗ', 'Патриот', 'Буханка'],
    models: ['Patriot', 'Pickup', 'Hunter', 'Profi', '469', '2206', '3909', '3962'],
  },
  {
    name: 'Volkswagen',
    aliases: ['Фольксваген', 'Ваг', 'VW'],
    models: ['Amarok', 'Caddy', 'Golf', 'Jetta', 'Multivan', 'Passat', 'Passat CC', 'Polo', 'Sharan', 'Teramont', 'Tiguan', 'Touareg', 'Touran', 'Transporter', 'Caravelle'],
  },
  {
    name: 'Volvo',
    aliases: ['Вольво'],
    models: ['C30', 'S40', 'S60', 'S80', 'S90', 'V40', 'V60', 'V90', 'XC40', 'XC60', 'XC70', 'XC90'],
  },
  {
    name: 'Zeekr',
    aliases: ['Зикр'],
    models: ['001', '007', 'X', '009'],
  },
  {
    name: 'Lada',
    aliases: ['Лада', 'ВАЗ', 'Жигули'],
    models: ['Granta', 'Vesta', 'Vesta SW Cross', 'XRAY', 'Largus', 'Niva Legend', 'Niva Travel', 'Kalina', 'Priora', 'Samara', '2101', '2104', '2105', '2106', '2107', '2108', '2109', '21099', '2110', '2111', '2112', '2114', '2115', '4x4'],
  },
]

/** Brand names in the order the pickers show them — plain A→Z. */
export const CAR_BRAND_NAMES: readonly string[] = CAR_BRANDS.map((brand) => brand.name)
  .slice()
  .sort((a, b) => a.localeCompare(b, 'ru'))

/**
 * Case, spacing and punctuation are exactly the parts of a car name people get
 * wrong — «mercedes benz», «Land-Rover», «bmw » all mean the badge on the car.
 */
function normalize(value: string): string {
  return value.toLowerCase().replace(/[\s\-_.]/g, '')
}

const BRANDS_BY_KEY = new Map<string, CarBrand>()
const ALIAS_KEYS_BY_NAME = new Map<string, readonly string[]>()
for (const brand of CAR_BRANDS) {
  BRANDS_BY_KEY.set(normalize(brand.name), brand)
  for (const alias of brand.aliases ?? []) {
    BRANDS_BY_KEY.set(normalize(alias), brand)
  }
  ALIAS_KEYS_BY_NAME.set(brand.name, (brand.aliases ?? []).map(normalize))
}

/** The catalog entry for whatever the user typed, brand name or alias. */
export function findBrand(query: string): CarBrand | undefined {
  return BRANDS_BY_KEY.get(normalize(query))
}

/**
 * Models to offer for a brand. An unknown brand returns nothing rather than the
 * whole catalog: suggesting Camry to someone who typed a kit-car name is worse
 * than suggesting nothing, and the field still takes free text either way.
 */
export function modelsForBrand(brand: string): readonly string[] {
  return findBrand(brand)?.models ?? []
}

/**
 * Whether a catalog entry answers what the user has typed so far. Substring
 * rather than prefix: people type the half of the name they remember, and
 * «benz» has to find Mercedes-Benz.
 */
export function matchesQuery(candidate: string, query: string): boolean {
  const normalizedQuery = normalize(query)
  if (normalizedQuery === '') return true
  if (normalize(candidate).includes(normalizedQuery)) return true

  // Aliases are matched against the brand they label, so «тойо» finds the item
  // shown as Toyota without the Cyrillic ever being displayed or stored.
  const aliasKeys = ALIAS_KEYS_BY_NAME.get(candidate)
  return aliasKeys !== undefined && aliasKeys.some((alias) => alias.includes(normalizedQuery))
}

/**
 * The catalog's spelling of a model, for whatever the user typed under a given
 * brand. Same purpose as `findBrand`: what gets stored should read the same
 * whether it was picked from the list or typed by hand.
 */
export function findModel(brand: string, query: string): string | undefined {
  const normalizedQuery = normalize(query)
  return modelsForBrand(brand).find((model) => normalize(model) === normalizedQuery)
}

/**
 * The pickers' primitive hands its filter an `unknown` item, so the adapter lives
 * here once rather than being re-declared beside every field that needs it.
 */
export const catalogFilter = (item: unknown, query: string): boolean =>
  matchesQuery(String(item), query)
