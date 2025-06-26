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


export function isValidNumber(value: string | number) {
  if (typeof value === 'string') {

    if (value === '') return false

    return !Number.isNaN(Number(value.trim()))
  }

  return typeof value === 'number' && !isNaN(value)
}