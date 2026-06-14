import { foreignKey, integer, real, sqliteTable } from 'drizzle-orm/sqlite-core'
import { productoProcesadoTable } from './productoProcesado'

export const trabajadorProcesoTable = sqliteTable('trabajadorProceso', {
  id: integer().primaryKey({ autoIncrement: true }),
  toneladasProcesadas: real().notNull(),
  totalColaboradores: integer().notNull(),
  distribucionInicializada: integer({ mode: 'boolean' }).notNull().default(false),

  idTrabajador: integer().notNull(),
  idProductoProcesado: integer().notNull(),
}, (table) => [
  foreignKey({ columns: [table.idProductoProcesado], foreignColumns: [productoProcesadoTable.id], }).onDelete('cascade')
])

export type TrabajadorProcesoInsert = typeof trabajadorProcesoTable.$inferInsert
export type TrabajadorProcesoUpdate = {
  id: number
  toneladasProcesadas: number
  totalColaboradores: number
}

export type TrabajadorProcesoSelect = typeof trabajadorProcesoTable.$inferSelect
export type TrabajadorProcesoSelect2 = {
  id: number
  toneladasProcesadas: number
  totalColaboradores: number
  nombreTrabajador: string | null
  idProductoProcesado: number
  idTrabajador: number
}

export type TrabajadorProcesoSelect3 = {
  idTrabajador: number
  nombreTrabajador: string
  idDistribucionDescuento: number | null
}