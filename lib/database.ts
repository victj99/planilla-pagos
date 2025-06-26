import { drizzle } from 'drizzle-orm/expo-sqlite'
import * as SQLite from 'expo-sqlite'
// import RNRestart from 'react-native-restart';

export const expoSQLite = SQLite.openDatabaseSync('database.db', { enableChangeListener: true })

export const db = drizzle(expoSQLite, { casing: 'camelCase', logger: false })

db.run('PRAGMA foreign_keys=ON;')

export function deleteCurrentSqliteDatabase() {
  expoSQLite.closeSync()
  SQLite.deleteDatabaseSync('database.db')
  // RNRestart.restart()
}