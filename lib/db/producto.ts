import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const productoTable = sqliteTable('producto', {
  id: integer().primaryKey({ autoIncrement: true }),
  nombre: text().notNull(),
  precioTonelada: real().notNull(),
})

export type ProductoInsert = typeof productoTable.$inferInsert
export type ProductoSelect = typeof productoTable.$inferSelect