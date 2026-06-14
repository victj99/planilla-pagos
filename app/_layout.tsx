import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import { PaperProvider } from 'react-native-paper'

import '@/components/bottom-sheets/sheets'
import { AppTheme } from '@/constants/Theme'
import { SheetProvider } from 'react-native-actions-sheet'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import '../global.css'

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  })

  if (!loaded) {
    return null
  }

  return (
    <SafeAreaProvider>
      <SheetProvider>
        <PaperProvider theme={AppTheme}>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: '#7C3AED' },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: { fontWeight: '600' },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="inicio" options={{ title: 'Inicio' }} />
            <Stack.Screen name="personas/index" options={{ title: 'Personas' }} />
            <Stack.Screen name="planilla/[id]" options={{ title: 'Planilla' }} />
            <Stack.Screen name="planilla/ajustes/[idPlanilla]" options={{ title: 'Ajustes' }} />
            <Stack.Screen name="planilla/cuadre/[idPlanilla]" options={{ title: 'Cuadre' }} />
            <Stack.Screen name="planilla/reporte-planilla" options={{ title: 'Reporte General' }} />
            <Stack.Screen name="planilla/detalle-proceso/[idProductoProcesado]" options={{ title: 'Detalle' }} />
            <Stack.Screen name="planilla/detalle-proceso/calculo-pago" options={{ title: 'Detalle' }} />
            <Stack.Screen name="planilla/detalle-proceso/reporte-detalle-proceso" options={{ title: 'Reporte' }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </PaperProvider>
      </SheetProvider>
    </SafeAreaProvider>
  )
}
