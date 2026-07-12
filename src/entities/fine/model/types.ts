export interface Fine {
  id: string
  carId: string
  numPost: string
  koapCode: string | null
  koapText: string | null
  sum: number
  enableDiscount: boolean
  dateDiscount: string | null
  dateDecision: string | null
  divisionName: string | null
  isPaid: boolean
  notifiedAt: string | null
  createdAt: string
}

export interface FinesResponse {
  fines: Fine[]
  stsNumber: string | null
  lastCheckAt: string | null
}

export interface CheckFinesResult {
  newFines: number
  total: number
}
