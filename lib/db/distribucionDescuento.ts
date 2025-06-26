import { foreignKey, integer, sqliteTable } from 'drizzle-orm/sqlite-core'
import { trabajadorTable } from './trabajador'
import { trabajadorProcesoTable } from './trabajadorProceso'

export const distribucionDescuentoTable = sqliteTable('distribucionDescuento', {
  id: integer().primaryKey({ autoIncrement: true }),
  idTrabajador: integer().notNull(),
  idTrabajadorProceso: integer().notNull(),
}, (table) => [
  foreignKey({ columns: [table.idTrabajador], foreignColumns: [trabajadorTable.id], }),
  foreignKey({ columns: [table.idTrabajadorProceso], foreignColumns: [trabajadorProcesoTable.id], }).onDelete('cascade')
])

export type DistribucionDescuentoInsert = typeof distribucionDescuentoTable.$inferInsert
export type DistribucionDescuentoSelect = typeof distribucionDescuentoTable.$inferSelect