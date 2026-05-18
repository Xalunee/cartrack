import type { Car } from '../model/types'

interface Props { car: Car }

export function CarCard({ car }: Props) {
  return (
    <div>
      <h2>{car.year} {car.brand} {car.model}</h2>
      <p>{car.currentMileage.toLocaleString()} km</p>
    </div>
  )
}
