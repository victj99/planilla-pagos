import { OpcionesMenu } from '@/components/OpcionesMenu'
import SeparatorView from '@/components/Separator'
import { eliminaTrabajadorProceso, liveQueryTrabajadoresProceso, obtenerCalculoPagoExtra, obtenerProductoProcesado2 } from '@/lib/database.service'
import { TrabajadorProcesoSelect2 } from '@/lib/db/trabajadorProceso'
import { calcularPagoTrabajador } from '@/lib/utils'
import { HeaderOptions } from '@react-navigation/elements'
import { FlashList } from '@shopify/flash-list'
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Text, View } from 'react-native'
import { SheetManager } from 'react-native-actions-sheet'
import { ActivityIndicator, Avatar, Card, IconButton, MD3Colors, Menu, Text as TextPaper } from 'react-native-paper'


type LiveQueryType = Awaited<ReturnType<typeof liveQueryTrabajadoresProceso>>

export default function ProductoProcesadoView() {
  const router = useRouter()
  const navigation = useNavigation()
  const { idProductoProcesado: idProdProcesado } = useLocalSearchParams()

  const productoProcesado = useMemo(
    () => obtenerProductoProcesado2(+idProdProcesado),
    [idProdProcesado]
  )

  const [trabajadoresProceso, setData] = useState<LiveQueryType>([])

  async function abrirAgregarTrabajador() {
    await SheetManager.show('agregar-trabajador-proceso-sheet', { payload: { idProductoProcesado: +idProdProcesado } })
    listarDatos()
  }

  async function abriReporteDetalleProceso() {
    router.navigate({ pathname: '/planilla/detalle-proceso/reporte-detalle-proceso', params: { idProductoProcesado: idProdProcesado } })
  }

  function onTrabajadorPress(id: number) {
    router.navigate({ pathname: '/planilla/detalle-proceso/calculo-pago', params: { idTrabajadorProceso: id } })
  }

  async function listarDatos() {
    const datos = await liveQueryTrabajadoresProceso(+idProdProcesado)
    setData(datos)
  }

  useEffect(() => {
    navigation.setOptions({
      headerTitle: `${productoProcesado?.nombreProducto}: ${productoProcesado?.toneladas}t`,
      headerRight: () => <OpcionesMenu>
        <Menu.Item onPress={abriReporteDetalleProceso} title="Ver reporte" leadingIcon='file-chart-outline' />
        <Menu.Item onPress={abrirAgregarTrabajador} title="Añadir trabajador" leadingIcon='plus' />
      </OpcionesMenu>
    } as HeaderOptions)
  }, [navigation])

  useFocusEffect(useCallback(() => {
    setData([])
    listarDatos()
  }, []))

  return <View className='h-full mx-2 pb-safe'>
    <TextPaper variant='titleMedium' className='mt-2'>Personal que procesó ({trabajadoresProceso.length})</TextPaper>
    <SeparatorView />

    <FlashList
      estimatedItemSize={300}
      data={trabajadoresProceso}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} ></View>}
      renderItem={({ item }) => <TarjetaDetalle
        data={item}
        precioTonelada={productoProcesado?.precioTonelada}
        onPress={onTrabajadorPress} />
      }
    />
  </View >
}

interface TarjetaDetalleProps {
  onPress: (id: number) => void
  data: TrabajadorProcesoSelect2
  precioTonelada?: number
}
function TarjetaDetalle({ data, onPress, precioTonelada = 0 }: TarjetaDetalleProps) {
  const [pago, setPago] = useState('P')

  async function eliminarRegistro() {
    Alert.alert('Confirmar', '¿Desea eliminar el registro?', [
      { text: 'No' },
      { text: 'Si', onPress: async () => await eliminaTrabajadorProceso(data.id) },
    ])
  }

  async function onInit() {
    const pagoExtra = await obtenerCalculoPagoExtra(data.idTrabajador, data.idProductoProcesado)
    const pagoTotal = calcularPagoTrabajador(data.totalColaboradores, {
      precioTonelada: precioTonelada,
      toneladasProcesadas: data.toneladasProcesadas,
      extra: pagoExtra || ''
    })

    setPago(pagoTotal + '')
  }

  useEffect(() => {
    onInit()
  }, [data.toneladasProcesadas, data.totalColaboradores])

  return <Card onPress={() => onPress(data.id)}>
    <Card.Content className='pl-[10] pr-0' style={{ paddingHorizontal: undefined }}>
      <View className='flex-row items-center'>
        <Avatar.Text
          size={40}
          label={getInitials(data.nombreTrabajador || '')}
          style={{ marginRight: 16 }}
        />

        <View className='flex-1'>
          <Text className='font-semibold text-xl'>{data.nombreTrabajador}</Text>

          <View className='flex-row flex-wrap'>
            <View className="w-full 2xs:w-[50%] flex-row">
              <Text className='font-medium text-purple-600'>Procesado: </Text>
              <Text>{data.toneladasProcesadas}t</Text>
            </View>
            <View className="w-full 2xs:w-[50%] flex-row">
              <Text className='font-medium text-purple-600'>Total: </Text>
              {pago === 'P' ? <ActivityIndicator size='small' /> : <Text>S/ {pago}</Text>}
            </View>
          </View>

        </View>

        <IconButton icon='delete' iconColor={MD3Colors.error60} onPress={eliminarRegistro} />
      </View>
    </Card.Content>
  </Card>
}

function getInitials(value: string) {
  const firstInitial = value.charAt(0).toUpperCase()
  const lastInitial = value.split(' ')[1]?.charAt(0).toUpperCase() || ''
  return `${firstInitial}${lastInitial}`
}