import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const planillaSemanalTable = sqliteTable('planillaSemanal', {
  id: integer().primaryKey({ autoIncrement: true }),
  nombre: text().notNull(),
  creacion: text().default(sql`current_timestamp`)
})

export type PlanillaSemanalInsert = typeof planillaSemanalTable.$inferInsert
export type PlanillaSemanalSelect = typeof planillaSemanalTable.$inferSelect