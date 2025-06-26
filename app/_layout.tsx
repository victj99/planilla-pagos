import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import { MD3LightTheme, PaperProvider } from 'react-native-paper'

import '@/components/bottom-sheets/sheets'
import { SheetProvider } from 'react-native-actions-sheet'
import '../global.css'

// import { useColorScheme } from '@/hooks/useColorScheme'

export default function RootLayout() {
  // const colorScheme = useColorScheme()
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  })

  if (!loaded) {
    // Async font loading only occurs in development.
    return null
  }

  return (
    <SheetProvider>
      <PaperProvider theme={MD3LightTheme}>

        <Stack >
          <Stack.Screen name="index" options={{ headerShown: false }} />

          <Stack.Screen name="inicio" options={{ title: 'Inicio' }} />
          <Stack.Screen name="planilla/[id]" options={{ title: 'Planilla' }} />
          <Stack.Screen name="planilla/reporte-planilla" options={{ title: 'Reporte General' }} />
          <Stack.Screen name="planilla/detalle-proceso/[idProductoProcesado]" options={{ title: 'Detalle' }} />
          <Stack.Screen name="planilla/detalle-proceso/calculo-pago" options={{ title: 'Detalle' }} />
          <Stack.Screen name="planilla/detalle-proceso/reporte-detalle-proceso" options={{ title: 'Reporte' }} />

          <Stack.Screen name="+not-found" />
        </Stack>
      </PaperProvider>
    </SheetProvider>
  )
}
