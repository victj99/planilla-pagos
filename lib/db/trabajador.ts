import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const trabajadorTable = sqliteTable('trabajador', {
  id: integer().primaryKey({ autoIncrement: true }),
  nombre: text().notNull(),
})

export type TrabajadorInsert = typeof trabajadorTable.$inferInsert
export type TrabajadorSelect = typeof trabajadorTable.$inferSelect