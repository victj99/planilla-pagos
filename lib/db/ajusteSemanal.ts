import { sql } from 'drizzle-orm'
import { foreignKey, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { planillaSemanalTable } from './planillaSemanal'
import { trabajadorTable } from './trabajador'

export const ajusteSemanalTable = sqliteTable('ajusteSemanal', {
  id: integer().primaryKey({ autoIncrement: true }),
  idPlanillaSemanal: integer().notNull(),
  idTrabajador: integer().notNull(),
  monto: real().notNull(),
  motivo: text().notNull(),
  nota: text(),
  creacion: text().default(sql`current_timestamp`),
}, (table) => [
  foreignKey({ columns: [table.idPlanillaSemanal], foreignColumns: [planillaSemanalTable.id] }).onDelete('cascade'),
  foreignKey({ columns: [table.idTrabajador], foreignColumns: [trabajadorTable.id] }),
])

export type AjusteSemanalInsert = typeof ajusteSemanalTable.$inferInsert
export type AjusteSemanalSelect = typeof ajusteSemanalTable.$inferSelect
