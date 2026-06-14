import { diasSemanaOpts } from '@/constants/Misc'
import Big from 'big.js'
import { format } from 'date-fns'

export function formatDate(value: string) {
  return format(new Date(value), 'dd/MM/yyyy HH:mm')
}

export function labelDiaSemana(value: string) {
  return diasSemanaOpts.find(item => item.value === value)?.label || 'Día desconocido'
}


export function calcularPagoTrabajador(totalPersonas: number | string, data: {
  toneladasProcesadas: number | string,
  precioTonelada: number | string
  extra?: number | string
}) {
  if (
    !isValidNumber(totalPersonas)
    || +totalPersonas <= 0
    || !isValidNumber(data.toneladasProcesadas)
    || !isValidNumber(data.precioTonelada)
  ) return 0

  let value = new Big(data.toneladasProcesadas.toString().trim())
  value = value.mul(data.precioTonelada.toString().trim()).div(totalPersonas.toString().trim() || '1')

  if (data.extra && isValidNumber(data.extra)) {
    value = value.add(data.extra.toString().trim())
  }

  return value.round(2).toNumber()
}


// Formatea un monto a 2 decimales con ceros (150 -> "150.00"), normalizando
// artefactos de punto flotante de las sumas. Maneja null/undefined -> "0.00".
export function formatearMonto(value: number | string | null | undefined): string {
  if (value == null || !isValidNumber(value)) return '0.00'
  return new Big(value.toString().trim()).round(2).toFixed(2)
}


// Normaliza un nombre para mostrar/guardar: trim, colapsa espacios,
// quita puntos sobrantes y aplica Title Case ("  juan  perez ." -> "Juan Perez")
export function normalizarNombre(raw: string) {
  const limpio = (raw || '')
    .replace(/\./g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!limpio) return ''

  return limpio
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
    .join(' ')
}

// Normaliza para comparar/buscar: minúsculas, sin acentos, sin puntos, espacios colapsados
export function normalizarParaBusqueda(raw: string) {
  return (raw || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\./g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Detecta nombres "casi iguales" para avisar de posibles duplicados.
// Considera similares si normalizados son iguales, o si todos los tokens
// de uno están contenidos en el otro (ej. "j perez" ~ "juan perez" no; "juan perez" ~ "juan perez g" sí).
export function sonNombresSimilares(a: string, b: string) {
  const na = normalizarParaBusqueda(a)
  const nb = normalizarParaBusqueda(b)

  if (!na || !nb) return false
  if (na === nb) return true

  const tokensA = na.split(' ')
  const tokensB = nb.split(' ')

  const contenidoAenB = tokensA.every(t => tokensB.includes(t))
  const contenidoBenA = tokensB.every(t => tokensA.includes(t))

  return contenidoAenB || contenidoBenA
}

export function isValidNumber(value: string | number) {
  if (typeof value === 'string') {

    if (value === '') return false

    return !Number.isNaN(Number(value.trim()))
  }

  return typeof value === 'number' && !isNaN(value)
}