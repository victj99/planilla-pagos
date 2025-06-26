import { foreignKey, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { planillaSemanalTable } from './planillaSemanal'

export const productoProcesadoTable = sqliteTable('productoProcesado', {
  id: integer().primaryKey({ autoIncrement: true }),
  idProducto: integer().notNull(),
  toneladas: real().notNull(),
  precioTonelada: real().notNull(),
  diaSemana: text().notNull(), // L, M, X, J, V, S, D
  etiqueta: text(),

  idPlanillaSemanal: integer().notNull(),
}, (table) => [
  foreignKey({ columns: [table.idPlanillaSemanal], foreignColumns: [planillaSemanalTable.id], }).onDelete('cascade')
])

export type ProductoProcesadoInsert = typeof productoProcesadoTable.$inferInsert
export type ProductoProcesadoSelect = typeof productoProcesadoTable.$inferSelect
export type ProductoProcesadoSelect2 = {
  id: number
  toneladas: number
  precioTonelada: number
  diaSemana: string
  nombreProducto: string | null
  etiqueta: string | null
}