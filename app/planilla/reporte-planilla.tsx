import SeparatorView from '@/components/Separator'
import { listarAjustesPorPlanilla, listarTrabajosPlanilla, obtenerAjustesPorTrabajadorPlanilla, obtenerCalculoPagoExtra } from '@/lib/database.service'
import { calcularPagoTrabajador, formatearMonto } from '@/lib/utils'
import { HeaderOptions } from '@react-navigation/elements'
import Big from 'big.js'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { isAvailableAsync, shareAsync } from 'expo-sharing'
import { useEffect, useRef, useState } from 'react'
import { LayoutChangeEvent, ScrollView, Text, TextProps, View } from 'react-native'
import { SheetManager } from 'react-native-actions-sheet'
import { ActivityIndicator, IconButton, Tooltip, TouchableRipple } from 'react-native-paper'
import ViewShot, { captureRef } from 'react-native-view-shot'

export interface DetalleDia {
  pagoTotalDia: number
  diaSemana: string
  detalle: {
    nombreProducto: string
    toneladasProcesadas: number
    totalColaboradores: number
    pagoTotal: number
  }[]
}

interface DataTabla {
  idTrabajador: number
  nombreTrabajador: string
  pagoTotal: number
  ajustes: number
  pagoNeto: number

  jueves: DetalleDia
  viernes: DetalleDia
  sabado: DetalleDia
  domingo: DetalleDia
  lunes: DetalleDia
  martes: DetalleDia
  miercoles: DetalleDia
}

interface DetalleGeneral {
  data: DataTabla[]
  totales: {
    jueves: number
    viernes: number
    sabado: number
    domingo: number
    lunes: number
    martes: number
    miercoles: number
    pagoTotal: number
    ajustes: number
    pagoNeto: number
  }
}

enum Dia {
  J = 'jueves',
  V = 'viernes',
  S = 'sabado',
  D = 'domingo',
  L = 'lunes',
  M = 'martes',
  X = 'miercoles',
}

export default function ReportePlanillaView() {
  const navigation = useNavigation()
  const { idPlanilla } = useLocalSearchParams()

  const snapshotRef = useRef(null)
  const [isPending, setIsPending] = useState(true)
  const [capturarLista, setcapturarLista] = useState(false)
  const [rowsH, setRowsH] = useState<number[]>([])
  const [ajustesDetalle, setAjustesDetalle] = useState<ReturnType<typeof listarAjustesPorPlanilla>>([])
  const [incluirAjustes, setIncluirAjustes] = useState(true)
  const [puedeCompartir, setPuedeCompartir] = useState(false)

  const [state, setState] = useState<DetalleGeneral>({
    data: [],
    totales: { jueves: 0, viernes: 0, sabado: 0, domingo: 0, lunes: 0, martes: 0, miercoles: 0, pagoTotal: 0, ajustes: 0, pagoNeto: 0 }
  })

  async function onInit() {
    const pagosTotales = { jueves: 0, viernes: 0, sabado: 0, domingo: 0, lunes: 0, martes: 0, miercoles: 0, pagoTotal: 0, ajustes: 0, pagoNeto: 0 }
    const mapaTrabajos = new Map<number, DataTabla>()
    const listaDatos = await listarTrabajosPlanilla(+idPlanilla)
    const mapaAjustes = obtenerAjustesPorTrabajadorPlanilla(+idPlanilla)
    setAjustesDetalle(listarAjustesPorPlanilla(+idPlanilla))

    for (const item of listaDatos) {
      if (!mapaTrabajos.has(item.idTrabajador)) {
        mapaTrabajos.set(item.idTrabajador, {
          idTrabajador: item.idTrabajador,
          nombreTrabajador: item.nombreTrabajador,
          pagoTotal: 0,
          ajustes: 0,
          pagoNeto: 0,
          jueves: { pagoTotalDia: 0, diaSemana: 'Jueves', detalle: [] },
          viernes: { pagoTotalDia: 0, diaSemana: 'Viernes', detalle: [] },
          sabado: { pagoTotalDia: 0, diaSemana: 'Sabado', detalle: [] },
          domingo: { pagoTotalDia: 0, diaSemana: 'Domingo', detalle: [] },
          lunes: { pagoTotalDia: 0, diaSemana: 'Lunes', detalle: [] },
          martes: { pagoTotalDia: 0, diaSemana: 'Martes', detalle: [] },
          miercoles: { pagoTotalDia: 0, diaSemana: 'Miercoles', detalle: [] },
        })
      }

      const trabajador = mapaTrabajos.get(item.idTrabajador)!

      const field: `${Dia}` = Dia[item.diaSemana]
      const datosDia = trabajador[field]

      const pagoExtra = await obtenerCalculoPagoExtra(item.idTrabajador, item.idProductoProcesado)
      const pagoTotal = calcularPagoTrabajador(item.totalColaboradores, {
        precioTonelada: item.precioTonelada,
        toneladasProcesadas: item.toneladasProcesadas,
        extra: pagoExtra || ''
      })

      datosDia.detalle.push({ nombreProducto: item.nombreProducto, pagoTotal, toneladasProcesadas: item.toneladasProcesadas, totalColaboradores: item.totalColaboradores })

      datosDia.pagoTotalDia = new Big(datosDia.pagoTotalDia).plus(pagoTotal).toNumber()
      trabajador.pagoTotal = new Big(trabajador.pagoTotal).plus(pagoTotal).toNumber()

      pagosTotales[field] = new Big(pagosTotales[field]).plus(pagoTotal).toNumber()
      pagosTotales.pagoTotal = new Big(pagosTotales.pagoTotal).plus(pagoTotal).toNumber()
    }

    // Aplicar ajustes (préstamos/castigos/etc.) y calcular el pago neto por trabajador
    for (const trabajador of mapaTrabajos.values()) {
      const ajustes = mapaAjustes.get(trabajador.idTrabajador) ?? 0
      trabajador.ajustes = new Big(ajustes).round(2).toNumber()
      trabajador.pagoNeto = new Big(trabajador.pagoTotal).plus(ajustes).round(2).toNumber()

      pagosTotales.ajustes = new Big(pagosTotales.ajustes).plus(ajustes).toNumber()
    }
    pagosTotales.pagoNeto = new Big(pagosTotales.pagoTotal).plus(pagosTotales.ajustes).round(2).toNumber()

    const resumenData = {
      data: [
        ...mapaTrabajos.values(),
      ], totales: pagosTotales
    }
    setState(resumenData)
    setIsPending(false)
  }

  async function capturarCompartir() {
    try {
      const res = await captureRef(snapshotRef, { format: 'jpg', result: 'tmpfile' })

      await shareAsync(res, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Compartir imagen',
        UTI: 'planilla.jpg'
      })
    } catch (error) {
      console.log(error)
    }
    setcapturarLista(false)
  }

  function mostrarDetalleDia(payload: DetalleDia) {
    if (payload.detalle.length > 0) {
      SheetManager.show('detalle-reporte-dia-sheet', { payload })
    }
  }

  const handleTextLayout = (event: LayoutChangeEvent, index: number) => {
    const { height } = event.nativeEvent.layout
    setRowsH((prev) => [...prev, height],)
  }

  useEffect(() => {
    if (capturarLista) {
      capturarCompartir()
    }
  }, [capturarLista])

  useEffect(() => {
    onInit()
    isAvailableAsync().then(setPuedeCompartir)
  }, [])

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <View className='flex-row items-center'>
        {ajustesDetalle.length > 0 && <Tooltip title={incluirAjustes ? 'Ocultar ajustes' : 'Mostrar ajustes'}>
          <IconButton
            icon={incluirAjustes ? 'eye' : 'eye-off'}
            iconColor='white'
            onPress={() => setIncluirAjustes(v => !v)}
            accessibilityLabel={incluirAjustes ? 'Ocultar ajustes del reporte' : 'Mostrar ajustes del reporte'}
          />
        </Tooltip>}
        {puedeCompartir && <Tooltip title='Compartir'>
          <IconButton icon='share-variant' iconColor='white' onPress={() => setcapturarLista(true)} />
        </Tooltip>}
      </View>
    } as HeaderOptions)
  }, [incluirAjustes, puedeCompartir, ajustesDetalle.length])

  if (isPending) {
    return <View className='h-full justify-center items-center'>
      <ActivityIndicator size='large' />
      <SeparatorView />
      <Text className='text-lg'>Cargando reporte</Text>
    </View>
  }

  return <View className='mx-2 pb-safe'>
    <ScrollView>
      <View className='flex-row'>

        {!capturarLista && <View className='w-[150]'>
          <TextHeader className='bg-white'>Trabajador</TextHeader>
          {state.data.map((item, idx) => (
            <TextRow className='w-[150] text-white bg-blue-500' key={'left-' + idx} onLayout={e => handleTextLayout(e, idx)}>
              {item.nombreTrabajador}
            </TextRow>
          ))}

          <TextRow className='w-[150] font-bold bg-green-200'>TOTAL</TextRow>
        </View>}

        <ScrollView horizontal>
          <ViewShot ref={snapshotRef} style={{ flex: 1, backgroundColor: 'white' }}>

            <View className='w-full flex-col'>
              <View className='flex-row bg-blue-500'>
                {capturarLista && <TextHeader className='bg-white w-[150]'>Trabajador</TextHeader>}
                <TextHeader>Jueves</TextHeader>
                <TextHeader>Viernes</TextHeader>
                <TextHeader>Sábado</TextHeader>
                <TextHeader>Domingo</TextHeader>
                <TextHeader>Lunes</TextHeader>
                <TextHeader>Martes</TextHeader>
                <TextHeader>Miercoles</TextHeader>
                <TextHeader>Bruto</TextHeader>
                <TextHeader>Ajustes</TextHeader>
                <TextHeader>Neto</TextHeader>
              </View>

              {state.data.map((item, idx) => (
                <View
                  className={`flex-row ${idx % 2 == 0 ? 'bg-purple-100' : ''}`}
                  style={{ height: rowsH[idx] }}
                  key={item.idTrabajador + '-' + idx}>

                  {capturarLista && <TextRow className='w-[150] text-white bg-blue-500' key={'left-' + idx}>
                    {item.nombreTrabajador}
                  </TextRow>}

                  <TextRow onLongPress={() => mostrarDetalleDia(item.jueves)}>
                    {item.jueves.pagoTotalDia ? `S/ ${formatearMonto(item.jueves.pagoTotalDia)}` : '-'}
                  </TextRow>

                  <TextRow onLongPress={() => mostrarDetalleDia(item.viernes)}>
                    {item.viernes.pagoTotalDia ? `S/ ${formatearMonto(item.viernes.pagoTotalDia)}` : '-'}
                  </TextRow>

                  <TextRow onLongPress={() => mostrarDetalleDia(item.sabado)}>
                    {item.sabado.pagoTotalDia ? `S/ ${formatearMonto(item.sabado.pagoTotalDia)}` : '-'}
                  </TextRow>

                  <TextRow onLongPress={() => mostrarDetalleDia(item.domingo)}>
                    {item.domingo.pagoTotalDia ? `S/ ${formatearMonto(item.domingo.pagoTotalDia)}` : '-'}
                  </TextRow>

                  <TextRow onLongPress={() => mostrarDetalleDia(item.lunes)}>
                    {item.lunes.pagoTotalDia ? `S/ ${formatearMonto(item.lunes.pagoTotalDia)}` : '-'}
                  </TextRow>

                  <TextRow onLongPress={() => mostrarDetalleDia(item.martes)}>
                    {item.martes.pagoTotalDia ? `S/ ${formatearMonto(item.martes.pagoTotalDia)}` : '-'}
                  </TextRow>

                  <TextRow onLongPress={() => mostrarDetalleDia(item.miercoles)}>
                    {item.miercoles.pagoTotalDia ? `S/ ${formatearMonto(item.miercoles.pagoTotalDia)}` : '-'}
                  </TextRow>

                  <TextRow>S/ {formatearMonto(item.pagoTotal)}</TextRow>
                  <TextRow>{item.ajustes ? `S/ ${formatearMonto(item.ajustes)}` : '-'}</TextRow>
                  <TextRow className='w-[112] text-center font-semibold'>S/ {formatearMonto(item.pagoNeto)}</TextRow>
                </View>
              ))}
              <View className='flex-row bg-green-200'>
                {capturarLista && <TextRow className='w-[150] font-bold bg-green-200'>TOTAL</TextRow>}
                <TextRow>S/ {formatearMonto(state.totales.jueves)}</TextRow>
                <TextRow>S/ {formatearMonto(state.totales.viernes)}</TextRow>
                <TextRow>S/ {formatearMonto(state.totales.sabado)}</TextRow>
                <TextRow>S/ {formatearMonto(state.totales.domingo)}</TextRow>
                <TextRow>S/ {formatearMonto(state.totales.lunes)}</TextRow>
                <TextRow>S/ {formatearMonto(state.totales.martes)}</TextRow>
                <TextRow>S/ {formatearMonto(state.totales.miercoles)}</TextRow>
                <TextRow>S/ {formatearMonto(state.totales.pagoTotal)}</TextRow>
                <TextRow>{state.totales.ajustes ? `S/ ${formatearMonto(state.totales.ajustes)}` : '-'}</TextRow>
                <TextRow className='w-[112] text-center font-bold'>S/ {formatearMonto(state.totales.pagoNeto)}</TextRow>
              </View>

              {incluirAjustes && ajustesDetalle.length > 0 && (
                <View style={{ width: (capturarLista ? 150 : 0) + 10 * 112 }} className='bg-white px-2 pt-3 pb-2'>
                  <Text className='font-bold text-xl text-purple-700 mb-1'>Ajustes</Text>
                  {ajustesDetalle.map((aj) => (
                    <View key={'aj-' + aj.id} className='py-1 border-b border-gray-200'>
                      <View className='flex-row justify-between'>
                        <Text className='text-base font-medium'>{aj.nombreTrabajador} · {aj.motivo}</Text>
                        <Text className={`text-base font-semibold ${aj.monto < 0 ? 'text-red-700' : 'text-green-700'}`}>
                          {aj.monto < 0 ? '−' : '+'} S/ {formatearMonto(Math.abs(aj.monto))}
                        </Text>
                      </View>
                      {aj.nota ? <Text className='text-sm text-gray-500'>{aj.nota}</Text> : null}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ViewShot>
        </ScrollView>
      </View>
    </ScrollView>
  </View>


  // return <View className='mx-2 pb-safe'>
  //   <ScrollView horizontal>
  //     <ViewShot ref={snapshotRef} style={{ flex: 1, backgroundColor: 'white' }}>
  //       <View className='flex-row bg-blue-500'>
  //         <TextHeader className='bg-white w-[150]'>Trabajador</TextHeader>
  //         <TextHeader>Jueves</TextHeader>
  //         <TextHeader>Viernes</TextHeader>
  //         <TextHeader>Sábado</TextHeader>
  //         <TextHeader>Domingo</TextHeader>
  //         <TextHeader>Lunes</TextHeader>
  //         <TextHeader>Martes</TextHeader>
  //         <TextHeader>Miercoles</TextHeader>
  //         <TextHeader>Total</TextHeader>
  //       </View>

  //       <ScrollView>
  //         {state.data.map((item, idx) => (
  //           <View
  //             className={`flex-row ${idx % 2 == 0 ? 'bg-purple-100' : ''}`}
  //             key={item.idTrabajador + '-' + idx}>
  //             <TextRow className='w-[150] text-white bg-blue-500'>
  //               {item.nombreTrabajador}
  //             </TextRow>

  //             <TextRow onLongPress={() => mostrarDetalleDia(item.jueves)}>
  //               {item.jueves.pagoTotalDia ? `S/ ${item.jueves.pagoTotalDia}` : '-'}
  //             </TextRow>

  //             <TextRow onLongPress={() => mostrarDetalleDia(item.viernes)}>
  //               {item.viernes.pagoTotalDia ? `S/ ${item.viernes.pagoTotalDia}` : '-'}
  //             </TextRow>

  //             <TextRow onLongPress={() => mostrarDetalleDia(item.sabado)}>
  //               {item.sabado.pagoTotalDia ? `S/ ${item.sabado.pagoTotalDia}` : '-'}
  //             </TextRow>

  //             <TextRow onLongPress={() => mostrarDetalleDia(item.domingo)}>
  //               {item.domingo.pagoTotalDia ? `S/ ${item.domingo.pagoTotalDia}` : '-'}
  //             </TextRow>

  //             <TextRow onLongPress={() => mostrarDetalleDia(item.lunes)}>
  //               {item.lunes.pagoTotalDia ? `S/ ${item.lunes.pagoTotalDia}` : '-'}
  //             </TextRow>

  //             <TextRow onLongPress={() => mostrarDetalleDia(item.martes)}>
  //               {item.martes.pagoTotalDia ? `S/ ${item.martes.pagoTotalDia}` : '-'}
  //             </TextRow>

  //             <TextRow onLongPress={() => mostrarDetalleDia(item.miercoles)}>
  //               {item.miercoles.pagoTotalDia ? `S/ ${item.miercoles.pagoTotalDia}` : '-'}
  //             </TextRow>

  //             <TextRow>S/ {item.pagoTotal}</TextRow>
  //           </View>
  //         ))}
  //       </ScrollView>

  //       <View className='flex-row bg-green-200'>
  //         <TextRow className='w-[150] font-bold'>TOTAL</TextRow>
  //         <TextRow>S/ {state.totales.jueves}</TextRow>
  //         <TextRow>S/ {state.totales.viernes}</TextRow>
  //         <TextRow>S/ {state.totales.sabado}</TextRow>
  //         <TextRow>S/ {state.totales.domingo}</TextRow>
  //         <TextRow>S/ {state.totales.lunes}</TextRow>
  //         <TextRow>S/ {state.totales.martes}</TextRow>
  //         <TextRow>S/ {state.totales.miercoles}</TextRow>
  //         <TextRow>S/ {state.totales.pagoTotal}</TextRow>
  //       </View>
  //     </ViewShot>
  //   </ScrollView>
  // </View>
}

function TextHeader({ children, className = `text-white w-[112] text-center`, ...props }: TextProps) {
  return <Text
    {...props}
    className={`font-semibold text-xl p-1 ${className}`}
  >
    {children}
  </Text>
}
function TextRow({ children, onLongPress, className = `w-[112] text-center`, ...props }: TextProps & { onLongPress?: () => void }) {
  return <TouchableRipple onLongPress={onLongPress}>
    <Text
      {...props}
      className={`text-lg px-1 py-2 ${className}`}
    >
      {children}
    </Text>
  </TouchableRipple>
}