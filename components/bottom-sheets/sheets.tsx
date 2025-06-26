import { DetalleDia } from '@/app/planilla/reporte-planilla'
import { SelectOption } from '@/constants/Misc'
import { registerSheet, SheetDefinition } from 'react-native-actions-sheet'
import AgregarTrabajadorProcesoSheet from './AgregarTrabajadorProcesoSheet'
import CrearPlanillaBottomSheet from './CrearPlanillaSheet'
import CrearProductoProcesadoSheet from './CrearProductoProcesadoSheet'
import DetalleReporteDiaSheet from './DetalleReporteDiaSheet'
import ElegirDiaSheet from './ElegirDiaSheet'

registerSheet('crear-planilla-sheet', CrearPlanillaBottomSheet)
registerSheet('crear-producto-procesado-sheet', CrearProductoProcesadoSheet)
registerSheet('elegir-dia-sheet', ElegirDiaSheet)
registerSheet('agregar-trabajador-proceso-sheet', AgregarTrabajadorProcesoSheet)
registerSheet('detalle-reporte-dia-sheet', DetalleReporteDiaSheet)

// We extend some of the types here to give us great intellisense
// across the app for all registered sheets.
declare module 'react-native-actions-sheet' {
  interface Sheets {
    'crear-planilla-sheet': SheetDefinition
    'crear-producto-procesado-sheet': SheetDefinition<{ payload: { idPlanilla: number, id?: number } }>
    'elegir-dia-sheet': SheetDefinition<{ payload: { value?: string }, returnValue: SelectOption | undefined }>
    'agregar-trabajador-proceso-sheet': SheetDefinition<{ payload: { idProductoProcesado: number } }>

    'detalle-reporte-dia-sheet': SheetDefinition<{ payload: DetalleDia }>
  }
}

export { }
