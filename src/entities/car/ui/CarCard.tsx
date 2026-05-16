import type { Car } from '../model/types'

interface Props { car: Car }

export function CarCard({ car }: Props) {
  return (
    <div>
      <h2>{car.year} {car.make} {car.model}</h2>
      <p>{car.mileage.toLocaleString()} km</p>
    </div>
  )
}
