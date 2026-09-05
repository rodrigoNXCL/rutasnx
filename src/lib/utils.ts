export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function validateRUT(rut: string): boolean {
  const cleaned = rut.replace(/[^0-9kK]/g, '')
  if (cleaned.length < 8) return false

  const body = cleaned.slice(0, -1)
  const dv = cleaned.slice(-1).toUpperCase()

  let sum = 0
  let multiplier = 2

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }

  const expectedDV = 11 - (sum % 11)
  const calculatedDV = expectedDV === 11 ? '0' : expectedDV === 10 ? 'K' : String(expectedDV)

  return calculatedDV === dv
}

export function formatRUT(rut: string): string {
  const cleaned = rut.replace(/[^0-9kK]/g, '')
  if (cleaned.length < 8) return rut

  const body = cleaned.slice(0, -1)
  const dv = cleaned.slice(-1).toUpperCase()

  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`
}

export function getChileanTimezone(): string {
  return 'America/Santiago'
}
