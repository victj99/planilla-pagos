
import migrations from '@/drizzle/migrations'
import { db, deleteCurrentSqliteDatabase } from '@/lib/database'
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator'
import { Redirect, SplashScreen } from 'expo-router'
import { useCallback, useEffect } from 'react'
import { Alert, ScrollView, Text, View } from 'react-native'
import { Button } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function App() {
  const { success, error } = useMigrations(db, migrations)

  const hideSplash = useCallback(async () => {
    await SplashScreen.hideAsync()
  }, [])

  function handleDeleteData() {
    Alert.alert('Confirmar', '¿Desea continuar?', [
      { text: 'Cancelar', style: 'cancel', onPress: () => { } },
      { text: 'Si', onPress: () => deleteCurrentSqliteDatabase() }
    ])
  }

  useEffect(() => {
    setTimeout(() => hideSplash(), 1000)
  }, [hideSplash])

  if (error) {
    return (
      <SafeAreaView className='flex-1 bg-slate-500'>
        <ScrollView>
          <View className='flex-1 mx-3 justify-center'>
            <Text className='text-white'>Migration error: {error.message}</Text>
          </View>
        </ScrollView>
        <Button onPress={handleDeleteData}>
          <Text className='text-white'>Eliminar datos y reiniciar la app</Text>
        </Button>
      </SafeAreaView>
    )
  }

  if (!success) {
    return (
      <View className="flex-1 justify-center">
        <Text className='text-center'>Migración en progreso...</Text>
      </View>
    )
  }

  return <Redirect href="/inicio" />
}