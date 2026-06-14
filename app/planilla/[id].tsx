import EmptyState from '@/components/EmptyState'
import { OpcionesMenu } from '@/components/OpcionesMenu'
import SeparatorView from '@/components/Separator'
import { eliminaProductoProcesado, obtenerCuadrePlanilla, obtenerProductosProcesadosPorPlanilla } from '@/lib/database.service'
import { ProductoProcesadoSelect2 } from '@/lib/db/productoProcesado'
import { formatearMonto, labelDiaSemana } from '@/lib/utils'
import { HeaderOptions } from '@react-navigation/elements'
import { FlashList } from '@shopify/flash-list'
import * as Haptics from 'expo-haptics'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert, Text, View } from 'react-native'
import { SheetManager } from 'react-native-actions-sheet'
import { Banner, Card, IconButton, MD3Colors, Menu, Text as TextPaper } from 'react-native-paper'

export default function PlanillaView() {
  const router = useRouter()
  const navigation = useNavigation()
  const { id } = useLocalSearchParams()
  const [productos, setProductos] = useState<ProductoProcesadoSelect2[]>([])
  const [pagoTotal, setPagoTotal] = useState(0)
  const [hayDescuadre, setHayDescuadre] = useState(false)

  function listarProductosProcesados() {
    const lista = obtenerProductosProcesadosPorPlanilla(+id)

    setProductos(lista)

    let sumaPago = 0
    for (const item of lista) {
      sumaPago += item.toneladas * item.precioTonelada
    }
    setPagoTotal(sumaPago)

    obtenerCuadrePlanilla(+id).then(c => setHayDescuadre(c.hayDescuadre))
  }

  async function abrirFormPlanilla(idProductoProcesado?: number) {
    await SheetManager.show('crear-producto-procesado-sheet', { payload: { idPlanilla: +id, id: idProductoProcesado } })
    listarProductosProcesados()
  }

  function abrirDetalle(id: number) {
    router.navigate({ pathname: '/planilla/detalle-proceso/[idProductoProcesado]', params: { idProductoProcesado: id } })
  }

  async function abrirReportePlanilla() {
    router.navigate({ pathname: '/planilla/reporte-planilla', params: { idPlanilla: id } })
  }

  function abrirAjustes() {
    router.navigate({ pathname: '/planilla/ajustes/[idPlanilla]', params: { idPlanilla: String(id) } })
  }

  function abrirCuadre() {
    router.navigate({ pathname: '/planilla/cuadre/[idPlanilla]', params: { idPlanilla: String(id) } })
  }

  async function eliminarRegistro(idProductoProcesado: number) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    Alert.alert('Confirmar', '¿Desea eliminar el registro?', [
      { text: 'No' },
      {
        text: 'Si', onPress: async () => {
          await eliminaProductoProcesado(idProductoProcesado)
          listarProductosProcesados()
        }
      },
    ])
  }

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <OpcionesMenu>
        <Menu.Item onPress={abrirReportePlanilla} title="Ver reporte general" leadingIcon='file-chart-outline' />
        <Menu.Item onPress={abrirCuadre} title="Cuadre de la planilla" leadingIcon='scale-balance' />
        <Menu.Item onPress={abrirAjustes} title="Ajustes de la semana" leadingIcon='cash-plus' />
        <Menu.Item onPress={() => abrirFormPlanilla()} title="Añadir trabajo a la planilla" leadingIcon='plus' />
      </OpcionesMenu>
    } as HeaderOptions)

    listarProductosProcesados()
  }, [navigation])

  return <View className='h-full mx-2 pb-safe'>
    <Banner
      visible={hayDescuadre}
      icon='scale-unbalanced'
      actions={[{ label: 'Ver cuadre', onPress: abrirCuadre }]}
    >
      Hay sesiones cuyo monto no calza. Revisa el cuadre para encontrar el descuadre.
    </Banner>

    <View className='flex-row justify-between items-center'>
      <TextPaper variant='titleMedium' className='mt-2'>Prod. procesados</TextPaper>
      <Text className='text-purple-600 font-semibold'>S/ {formatearMonto(pagoTotal)} (bruto)</Text>
    </View>
    <SeparatorView />

    <FlashList
      data={productos}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      ListEmptyComponent={
        <EmptyState
          icon='package-variant-closed-plus'
          title='Sin registros'
          description='Añade un trabajo a la planilla usando el menú superior.'
        />
      }
      renderItem={({ item }) => (
        <Card
          onLongPress={() => abrirFormPlanilla(item.id)}
          onPress={() => abrirDetalle(item.id)}
          accessibilityRole='button'
          accessibilityLabel={`Ver detalle: ${labelDiaSemana(item.diaSemana)} - ${item.nombreProducto}`}
        >
          <Card.Title
            titleStyle={{ fontWeight: '500', fontSize: 20, color: MD3Colors.primary10 }}
            title={labelDiaSemana(item.diaSemana)}
            right={() => (
              <IconButton
                icon='delete'
                iconColor={MD3Colors.error60}
                onPress={() => eliminarRegistro(item.id)}
                accessibilityLabel='Eliminar registro'
              />
            )}
            subtitle={item.nombreProducto + (item.etiqueta ? ` (${item.etiqueta})` : '')}
          />
          <Card.Content>
            <View className='flex-row flex-wrap justify-between'>
              <View className='flex-row'>
                <Text className='font-semibold text-purple-600'>Toneladas: </Text>
                <Text>{item.toneladas}t</Text>
              </View>
              <View className='flex-row'>
                <Text className='font-semibold text-purple-600'>Total: </Text>
                <Text>S/ {formatearMonto(item.toneladas * item.precioTonelada)}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}
    />
  </View>
}