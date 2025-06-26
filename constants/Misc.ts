import { REQUIRED_MSG } from './Messages'

export interface SelectOption {
  label: string
  value: string
}

export interface SelectOption2 {
  label: string
  value: number
}

export const diasSemanaOpts: SelectOption[] = [
  { value: 'J', label: 'Jueves' },
  { value: 'V', label: 'Viernes' },
  { value: 'S', label: 'Sábado' },
  { value: 'D', label: 'Domingo' },
  { value: 'L', label: 'Lunes' },
  { value: 'M', label: 'Martes' },
  { value: 'X', label: 'Miercoles' },
]

export const REQUIRED_RULE = { required: { value: true, message: REQUIRED_MSG } }
export const REQUIRED_DECIMAL = {
  ...REQUIRED_RULE,
  pattern: { value: /^\d+(\.\d{1,3})?$/, message: 'Ingrese un valor válido' },
  min: { value: 1, message: 'Debe ingresar un valor mínimo mayor a cero' }
}

export const REQUIRED_INT = {
  ...REQUIRED_RULE,
  pattern: { value: /^[0-9]+$/, message: 'Ingrese un valor válido' },
  min: { value: 1, message: 'Debe ingresar un valor mínimo mayor a cero' }
}