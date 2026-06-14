import SeparatorView from '@/components/Separator'
import { liveQueryTrabajadoresProceso, obtenerCalculoPagoExtra, obtenerDatosPagoExtra, obtenerProductoProcesado2 } from '@/lib/database.service'
import { calcularPagoTrabajador, formatearMonto } from '@/lib/utils'
import { FlashList } from '@shopify/flash-list'
import Big from 'big.js'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Dimensions, Text, View } from 'react-native'
import ActionSheet, { ActionSheetRef, ScrollView } from 'react-native-actions-sheet'
import { ActivityIndicator, Card, Divider, List } from 'react-native-paper'

const { height: screenHeight } = Dimensions.get('window')
const MAX_LIST_HEIGHT_PERCENTAGE = 0.7 // 80% de la altura de la pantalla
const MAX_LIST_HEIGHT = screenHeight * MAX_LIST_HEIGHT_PERCENTAGE

interface DetalleProducto {
  idTrabajador: number
  toneladasProcesadas: number
  nombreTrabajador: string
  totalColaboradores?: number
  pagoTotal: number
}

interface DetalleGeneral {
  data: DetalleProducto[],
  total: number,
  nombreProducto: string
  toneladas: number
  pagoProducto: number
}

export default function ReporteProceso() {
  const { idProductoProcesado: idProdProcesado } = useLocalSearchParams()

  const [isPending, setIsPending] = useState(true)
  const [state, setState] = useState<DetalleGeneral>({ data: [], total: 0, toneladas: 0, nombreProducto: '', pagoProducto: 0 })

  async function onInit() {
    let total = 0
    const productoProcesado = obtenerProductoProcesado2(+idProdProcesado)
    const data = await liveQueryTrabajadoresProceso(+idProdProcesado)

    const mapaTrabajadores = new Map<number, DetalleProducto>()

    for (const item of data) {
      const pagoExtra = await obtenerCalculoPagoExtra(item.idTrabajador, +idProdProcesado)

      const pagoTotal = calcularPagoTrabajador(item.totalColaboradores, {
        precioTonelada: productoProcesado.precioTonelada,
        toneladasProcesadas: item.toneladasProcesadas,
        extra: pagoExtra || ''
      })

      total = new Big(total).add(pagoTotal).toNumber()

      if (mapaTrabajadores.has(item.idTrabajador)) {
        const existente = mapaTrabajadores.get(item.idTrabajador)

        existente!.toneladasProcesadas = new Big(existente!.toneladasProcesadas)
          .add(item.toneladasProcesadas)
          .round(2).toNumber()

        existente!.pagoTotal = new Big(existente!.pagoTotal)
          .add(pagoTotal)
          .round(2).toNumber()

        continue
      }

      mapaTrabajadores.set(item.idTrabajador, {
        idTrabajador: item.idTrabajador,
        nombreTrabajador: item.nombreTrabajador,
        totalColaboradores: item.totalColaboradores,
        toneladasProcesadas: item.toneladasProcesadas,
        pagoTotal
      })
    }

    setIsPending(false)
    setState({
      total,
      ...productoProcesado,
      data: [...mapaTrabajadores.values()],
      pagoProducto: new Big(productoProcesado.toneladas).mul(productoProcesado.precioTonelada).round(2).toNumber(),
    })
  }

  useEffect(() => {
    onInit()
  }, [])

  if (isPending) {
    return <View className='h-full justify-center items-center'>
      <ActivityIndicator size='large' />
      <SeparatorView />
      <Text className='text-lg'>Cargando datos</Text>
    </View>
  }

  return <View className='h-full pt-2 px-2 pb-safe'>
    <View className='flex-row justify-between'>
      <Text className='text-sm 2xs:text-lg font-semibold'>
        Producto:
        <Text className='text-purple-500'> {state.nombreProducto}</Text>
      </Text>
      <Text className='text-sm 2xs:text-lg font-semibold'>
        Toneladas:
        <Text className='text-purple-500'> {state.toneladas}</Text>
      </Text>
    </View>

    <View className='flex-row justify-between'>
      <Text className='text-sm 2xs:text-lg font-semibold'>
        Trabajadores:
        <Text className='text-blue-500'> {state.data.length}</Text>
      </Text>

      <Text className='text-sm 2xs:text-lg font-semibold'>
        Pago:
        <Text className='text-purple-500'> S/ {formatearMonto(state.pagoProducto)}</Text>
      </Text>
    </View>

    <Divider className='my-2' />

    <ListaDetalle data={state.data} idProductoProcesado={+idProdProcesado} />

    <Divider className='my-2' />

    <View className='flex-row justify-end mb-4'>
      <Text className='text-lg font-semibold'>
        Total:
        <Text
          className={state.total === state.pagoProducto ? 'text-green-800' : 'text-red-800'}
        > S/ {formatearMonto(state.total)}</Text>
      </Text>
      {/* <Text className={state.total === state.pagoProducto ? 'text-green-800' : 'text-red-800'}> S/ {state.total}</Text> */}
    </View>

    <DiferenciaCuadre esperado={state.pagoProducto} asignado={state.total} />

  </View>
}

function DiferenciaCuadre({ esperado, asignado }: { esperado: number, asignado: number }) {
  const diferencia = new Big(esperado).minus(asignado).round(2).toNumber()

  if (diferencia === 0) {
    return <Text className='text-right text-green-700 mt-1'>✓ El pago cuadra con lo procesado</Text>
  }

  return <Text className='text-right text-red-700 mt-1'>
    {diferencia > 0
      ? `Faltan S/ ${formatearMonto(diferencia)} por asignar (remanente sin repartir)`
      : `Sobre-asignado S/ ${formatearMonto(Math.abs(diferencia))}`}
  </Text>
}

interface ListaDetalleProps {
  data: DetalleProducto[]
  idProductoProcesado: number
}
function ListaDetalle({ data, idProductoProcesado }: ListaDetalleProps) {
  const actionSheetRef = useRef<ActionSheetRef>(null)
  const [datosSelet, setDatosSelet] = useState<DetalleProducto | null>(null)

  const dynamicListHeight = useMemo(() => {
    if (!data || data.length === 0) return 85 // Si no hay datos, usa la altura mínima

    const calculatedHeight = data.length * 85
    const clampedMinHeight = Math.max(calculatedHeight, 85)

    return Math.min(clampedMinHeight, MAX_LIST_HEIGHT)
  }, [data]) // Recalcula si los datos cambian

  return <View style={{ height: dynamicListHeight }}>
    <FlashList
      data={data}
      ItemSeparatorComponent={() => <SeparatorView />}
      renderItem={({ item }) => <Card
        onLongPress={() => {
          setDatosSelet(item)
          actionSheetRef.current?.show()
        }}
      >
        <Card.Content>
          <View className='flex-row items-center'>

            <View className='flex-1'>
              <Text className='font-semibold text-xl'>
                {item.nombreTrabajador}
              </Text>

              <View className='flex-row'>
                <Text className='text-[13px] 2xs:text-base font-medium text-purple-600'>Procesado: </Text>
                <Text className='text-[13px] 2xs:text-base '>{item.toneladasProcesadas}t</Text>
                <Text className='text-[13px] 2xs:text-base font-medium text-purple-600 ml-auto'>Total: </Text>
                <Text className='text-[13px] 2xs:text-base '>S/ {formatearMonto(item.pagoTotal)}</Text>
              </View>
            </View>

          </View>
        </Card.Content>
      </Card>}
    />

    <ActionSheet
      ref={actionSheetRef}
      containerStyle={{ minHeight: 300, paddingHorizontal: 10 }}
    >
      <Text className='text-lg mt-2 font-semibold text-purple-500'>Detalle de pago</Text>
      <Divider className='my-1' />

      <DetallePagoSheet
        data={datosSelet}
        idProductoProcesado={idProductoProcesado}
      />
    </ActionSheet>
  </View>
}

interface DetallePagoSheetProps {
  data: DetalleProducto | null
  idProductoProcesado: number
}
function DetallePagoSheet({ data, idProductoProcesado }: DetallePagoSheetProps) {
  const [lista, setLista] = useState<DetalleProducto[]>([])
  const [pagoInicial, setPagoInicial] = useState(0)

  async function onInit() {
    if (!data?.idTrabajador) return

    const datosPago = await obtenerDatosPagoExtra(data.idTrabajador, idProductoProcesado)

    if (datosPago.length > 0 && data.totalColaboradores) {
      const res = new Big(data.toneladasProcesadas)
        .mul(datosPago[0].precioTonelada)
        .div(data.totalColaboradores)
        .round(2).toNumber()

      setPagoInicial(res)
    }

    const dataMap: DetalleProducto[] = datosPago.map(item => {
      const toneladasRestantes = new Big(item.toneladasTotales).minus(item.toneladasProcesadas)

      const monto1 = toneladasRestantes.mul(item.precioTonelada)
      const monto2 = monto1.div(item.totalColaboradores)

      return {
        idTrabajador: 0,
        nombreTrabajador: item.nombreTrabajadorProceso,
        toneladasProcesadas: toneladasRestantes.toNumber(),
        totalColaboradores: item.totalColaboradoresReparto,
        pagoTotal: monto2.div(item.totalColaboradoresReparto).round(2).toNumber()
      }
    })

    setLista(dataMap)
  }
  useEffect(() => {
    onInit()
  }, [])

  return <View className='max-h-[400]'>
    <View className='flex-row justify-between'>
      <Text>
        Pago por tonelada:
        <Text className='text-[12px]'> ({data?.toneladasProcesadas}t / {data?.totalColaboradores})</Text>
      </Text>
      <Text className='font-bold mr-5'>S/ {formatearMonto(pagoInicial || data?.pagoTotal)}</Text>
    </View>
    <SeparatorView />

    {lista.length > 0 && <Text>Extras por descuento:</Text>}
    <ScrollView>
      {lista.map((item, idx) => <List.Item
        key={'detpago' + idx}
        className='mb-2 bg-gray-100'
        // title={item.nombreTrabajador}
        title={<Text>
          {item.nombreTrabajador}
          <Text className='text-[12px]'> ({item.toneladasProcesadas}t / {item.totalColaboradores})</Text>
        </Text>}
        right={() => <Text className='font-bold'>S/ {formatearMonto(item.pagoTotal)}</Text>}
      />)}
    </ScrollView>

    <Divider className='my-2' />
    <View className='flex-row justify-between'>
      <Text>Pago Total: </Text>
      <Text className='font-bold text-purple-700 mr-5'>S/ {formatearMonto(data?.pagoTotal)}</Text>
    </View>
  </View>
}