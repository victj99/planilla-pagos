import EmptyState from '@/components/EmptyState'
import { obtenerResumenPlanillas } from '@/lib/database.service'
import { formatDate } from '@/lib/utils'
import { normalizarParaBusqueda } from '@/lib/utils'
import { FlashList } from "@shopify/flash-list"
import * as NavigationBar from 'expo-navigation-bar'
import { useNavigation, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { GestureResponderEvent, Text, View } from 'react-native'
import { SheetManager } from 'react-native-actions-sheet'
import { Card, Icon, IconButton, Searchbar } from 'react-native-paper'

interface BotonProps {
  onClick: (e: GestureResponderEvent) => void
}

function BotonesHeader({ onAgregar, onPersonas }: { onAgregar: BotonProps['onClick'], onPersonas: () => void }) {
  return <View className='flex-row items-center'>
    <IconButton icon='account-group' iconColor='white' onPress={onPersonas} accessibilityLabel='Gestionar personas' />
    <IconButton icon='plus' mode='contained-tonal' onPress={onAgregar} accessibilityLabel='Crear planilla' />
  </View>
}

type PlanillaResumen = ReturnType<typeof obtenerResumenPlanillas>[number]

export default function MainView() {
  const router = useRouter()
  const navigation = useNavigation()
  const [planillas, setPlanillas] = useState<PlanillaResumen[]>([])
  const [query, setQuery] = useState('')

  const filtrados = query
    ? planillas.filter(p => normalizarParaBusqueda(p.nombre).includes(normalizarParaBusqueda(query)))
    : planillas

  async function abrirFormPlanilla() {
    await SheetManager.show('crear-planilla-sheet')
    listarPlanillas()
  }

  function listarPlanillas() {
    setPlanillas(obtenerResumenPlanillas())
  }

  function abrirPlanilla(id: number) {
    router.navigate({ pathname: '/planilla/[id]', params: { id: id } })
  }

  useEffect(() => {
    try {
      NavigationBar.setStyle('inverted')
    } catch (error) { }

    navigation.setOptions({
      headerRight: () => <BotonesHeader
        onAgregar={() => abrirFormPlanilla()}
        onPersonas={() => router.navigate('/personas')}
      />
    })

    listarPlanillas()
  }, [navigation])

  return <View className='h-full pb-safe'>
    <Searchbar
      placeholder='Buscar planilla'
      value={query}
      onChangeText={setQuery}
      className='mx-2 mt-2 mb-1'
    />

    <FlashList
      data={filtrados}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 4, paddingBottom: 8 }}
      ListEmptyComponent={
        <EmptyState
          icon={query ? 'magnify-close' : 'calendar-plus'}
          title={query ? 'Sin resultados' : 'Sin planillas'}
          description={query
            ? `No hay planillas que coincidan con "${query}".`
            : 'Crea una nueva planilla semanal para empezar a registrar pagos.'}
          actionLabel={query ? undefined : 'Crear planilla'}
          onAction={query ? undefined : () => abrirFormPlanilla()}
        />
      }
      renderItem={({ item }) => (
        <Card
          mode='elevated'
          onPress={() => abrirPlanilla(item.id)}
          accessibilityRole='button'
          accessibilityLabel={`Abrir planilla ${item.nombre}`}
        >
          <Card.Title
            title={item.nombre}
            subtitle={formatDate(item.creacion!)}
            right={() => item.totalBruto > 0
              ? <Text className='mr-4 font-bold' style={{ color: '#15803D' }}>
                  S/ {item.totalBruto.toFixed(2)}
                </Text>
              : null
            }
          />
          {item.sesiones > 0 && (
            <Card.Content className='pt-0'>
              <View className='flex-row items-center gap-1'>
                <Icon source='package-variant' size={14} color='#7C3AED' />
                <Text className='text-sm' style={{ color: '#6B7280' }}>
                  {item.sesiones} {item.sesiones === 1 ? 'sesión' : 'sesiones'}
                </Text>
              </View>
            </Card.Content>
          )}
        </Card>
      )}
    />
  </View>
}
