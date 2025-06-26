import { OpcionesMenu } from '@/components/OpcionesMenu'
import SeparatorView from '@/components/Separator'
import { eliminaProductoProcesado, obtenerProductosProcesadosPorPlanilla } from '@/lib/database.service'
import { ProductoProcesadoSelect2 } from '@/lib/db/productoProcesado'
import { labelDiaSemana } from '@/lib/utils'
import { HeaderOptions } from '@react-navigation/elements'
import { FlashList } from '@shopify/flash-list'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert, Text, View } from 'react-native'
import { SheetManager } from 'react-native-actions-sheet'
import { Card, IconButton, MD3Colors, Menu, Text as TextPaper } from 'react-native-paper'

export default function PlanillaView() {
  const router = useRouter()
  const navigation = useNavigation()
  const { id } = useLocalSearchParams()
  const [productos, setProductos] = useState<ProductoProcesadoSelect2[]>([])
  const [pagoTotal, setPagoTotal] = useState(0)

  function listarProductosProcesados() {
    const lista = obtenerProductosProcesadosPorPlanilla(+id)

    setProductos(lista)

    let sumaPago = 0
    for (const item of lista) {
      sumaPago += item.toneladas * item.precioTonelada
    }
    setPagoTotal(sumaPago)
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

  async function eliminarRegistro(idProductoProcesado: number) {
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
        <Menu.Item onPress={() => abrirFormPlanilla()} title="Añadir trabajo a la planilla" leadingIcon='plus' />
      </OpcionesMenu>
    } as HeaderOptions)

    listarProductosProcesados()
  }, [navigation])

  return <View className='h-full mx-2 pb-safe'>
    <View className='flex-row justify-between items-center'>
      <TextPaper variant='titleMedium' className='mt-2'>Prod. procesados</TextPaper>
      <Text className='text-purple-600 font-semibold'>S/ {pagoTotal}</Text>
    </View>
    <SeparatorView />

    <FlashList
      estimatedItemSize={300}
      data={productos}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} ></View>}
      renderItem={({ item }) => <Card
        onLongPress={() => abrirFormPlanilla(item.id)}
        onPress={() => abrirDetalle(item.id)}
      >
        <Card.Title
          titleStyle={{ fontWeight: 500, fontSize: 20, color: MD3Colors.primary10 }}
          title={labelDiaSemana(item.diaSemana)}
          right={() => <IconButton icon='delete' iconColor={MD3Colors.error60} onPress={() => eliminarRegistro(item.id)} />}
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
              <Text>S/ {(item.toneladas * item.precioTonelada).toFixed(2)}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>}
    />
  </View>
}