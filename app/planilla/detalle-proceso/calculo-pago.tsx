import TextInputForm from '@/components/form/TextInputForm'
import SeparatorView from '@/components/Separator'
import { REQUIRED_DECIMAL, REQUIRED_INT } from '@/constants/Misc'
import { actualizarTrabajadorProceso, eliminarDistribucionDescuento, inicializarDistribucion, insertarDistribucionDescuento, limpiarDistribucion, obtenerTrabajadoresProductoProceso, obtenerTrabajadorProceso2 } from '@/lib/database.service'
import { TrabajadorProcesoSelect3, TrabajadorProcesoUpdate } from '@/lib/db/trabajadorProceso'
import { calcularPagoTrabajador, formatearMonto } from '@/lib/utils'
import { HeaderOptions } from '@react-navigation/elements'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Control, useForm, useWatch } from 'react-hook-form'
import { ScrollView, Text, View } from 'react-native'
import { SheetManager } from 'react-native-actions-sheet'
import { Button, Checkbox, Divider, MD3Colors, TextInput } from 'react-native-paper'

export default function CalculoPagoView() {
  const router = useRouter()
  const navigation = useNavigation()
  const { idTrabajadorProceso } = useLocalSearchParams()

  const datosProceso = useMemo(
    () => obtenerTrabajadorProceso2(+idTrabajadorProceso),
    [idTrabajadorProceso]
  )

  const { control, handleSubmit, setValue, getValues } = useForm<TrabajadorProcesoUpdate>({
    mode: 'onBlur',
    defaultValues: {
      id: datosProceso?.id,
      toneladasProcesadas: datosProceso?.toneladasProcesadas || datosProceso?.toneladasTotales,
      totalColaboradores: datosProceso?.totalColaboradores || datosProceso.maxTrabajadores
    }
  })

  async function submit(data: TrabajadorProcesoUpdate) {
    await actualizarTrabajadorProceso(data)
    router.back()
  }

  async function abrirCalculadora() {
    const actual = getValues('toneladasProcesadas')
    const resultado = await SheetManager.show('calculadora-sheet', {
      payload: { value: actual != null && `${actual}` !== '' ? Number(actual) : undefined }
    })
    if (resultado != null) {
      setValue('toneladasProcesadas', resultado, { shouldValidate: true })
    }
  }

  useEffect(() => {
    navigation.setOptions({
      headerTitle: `Detalle: ${datosProceso?.nombreTrabajador}`,
    } as HeaderOptions)
  }, [navigation])

  return <View className='h-full mx-3 my-2'>
    <TextInputForm
      control={control}
      controlName='toneladasProcesadas'
      label='Toneladas procesadas'
      inputMode='decimal'
      right={<TextInput.Icon icon='calculator' onPress={abrirCalculadora} forceTextInputFocus={false} />}
      rules={{
        ...REQUIRED_DECIMAL,
        validate: (val) => {
          const ton = val?.toString() || '0'
          if (+ton <= datosProceso!.toneladasTotales) return true

          return 'No se puede superar el límite de ' + datosProceso?.toneladasTotales
        }
      }}
    />
    <SeparatorView />

    <TextInputForm
      control={control}
      controlName='totalColaboradores'
      label='Total de trabajadores'
      inputMode='numeric'
      rules={REQUIRED_INT}
    />
    <SeparatorView />

    <Divider className='my-1' />

    <ListaDistribucionDescuento
      control={control}
      idProductoProcesado={datosProceso!.idProductoProcesado}
      toneladasTotales={datosProceso?.toneladasTotales}
      idTrabajadorActual={datosProceso!.idTrabajador}
      idTrabajadorProceso={datosProceso!.id}
      distribucionInicializada={!!datosProceso?.distribucionInicializada}
    />

    <Divider className='my-1' />
    <DetallePago
      control={control}
      toneladasTotales={datosProceso?.toneladasTotales}
      precioTonelada={datosProceso?.precioTonelada} />

    <View className='my-10'>
      <Button mode='outlined' onPress={handleSubmit(submit)}>Guardar</Button>
    </View>
  </View>
}

interface ListaDistDescuentoProps {
  control: Control<TrabajadorProcesoUpdate>
  toneladasTotales?: number
  idProductoProcesado: number
  idTrabajadorActual: number
  idTrabajadorProceso: number
  distribucionInicializada: boolean
}

function ListaDistribucionDescuento({ control, toneladasTotales = 0, ...props }: ListaDistDescuentoProps) {
  const toneladasProcesadas = useWatch({ control, name: 'toneladasProcesadas' })
  const [, recargar] = useState(0)
  const [inicializada, setInicializada] = useState(props.distribucionInicializada)

  const proc = Number(toneladasProcesadas)
  const hayRestante = toneladasProcesadas != null && `${toneladasProcesadas}` !== '' && Number.isFinite(proc) && proc !== toneladasTotales

  // Por defecto, la primera vez que hay restante se marcan todos los demás
  // trabajadores; si deja de haber restante se limpia para empezar de cero.
  useEffect(() => {
    if (hayRestante && !inicializada) {
      setInicializada(true)
      inicializarDistribucion(props.idTrabajadorProceso, props.idProductoProcesado, props.idTrabajadorActual)
        .then(() => recargar(v => v + 1))
    } else if (!hayRestante && inicializada) {
      setInicializada(false)
      limpiarDistribucion(props.idTrabajadorProceso)
    }
  }, [hayRestante, inicializada])

  if (!hayRestante) return <View className='items-center'>
    <Text className='font-semibold'>Sin descuento</Text>
  </View>

  const trabajadores = obtenerTrabajadoresProductoProceso(props.idProductoProcesado, props.idTrabajadorProceso)

  async function handleOnCheck(item: TrabajadorProcesoSelect3) {
    if (item.idDistribucionDescuento) {
      await eliminarDistribucionDescuento(item.idDistribucionDescuento)
      recargar(v => v + 1)
      return
    }

    await insertarDistribucionDescuento(item.idTrabajador, props.idTrabajadorProceso)
    recargar(v => v + 1)
  }


  return <View className='min-h-[100] max-h-[50%]' >
    <Text className='text-purple-700 mb-2'>Elegir los trabajadores que recibirán el restante</Text>

    <ScrollView>
      {
        trabajadores.map((item, idx) => <Checkbox.Item
          key={'trabDist' + idx}
          label={item.nombreTrabajador + (item.idTrabajador === props.idTrabajadorActual ? ' (Actual)' : '')}
          status={item.idDistribucionDescuento ? 'checked' : 'unchecked'}
          onPress={() => handleOnCheck(item)}
          mode='android'
          disabled={item.idTrabajador === props.idTrabajadorActual}
          style={{ borderWidth: 0.3, borderColor: MD3Colors.primary80, height: 50, marginBottom: 5 }}
        />)
      }
    </ScrollView>
  </View>
}

interface DetallePagoProps {
  control: Control<TrabajadorProcesoUpdate>
  toneladasTotales?: number
  precioTonelada?: number
}

function DetallePago({ control, toneladasTotales = 0, precioTonelada = 0 }: DetallePagoProps) {

  const toneladasProcesadas = useWatch({ control, name: 'toneladasProcesadas' })
  const totalColaboradores = useWatch({ control, name: 'totalColaboradores' })

  const pagoTrabajador = () => calcularPagoTrabajador(totalColaboradores, { toneladasProcesadas, precioTonelada })

  return <View className='gap-2'>
    <Text className='text-purple-600 text-lg font-semibold'>Resumen</Text>

    <View className='flex-row justify-between'>
      <Text className='text-[12px] 2xs:text-base'>
        Ton totales: <Text className='font-semibold'>{toneladasTotales}</Text>
      </Text>
      <Text className='text-[12px] 2xs:text-base'>
        Ton procesadas: <Text className='font-semibold'>{toneladasProcesadas}</Text>
      </Text>
    </View>

    <View className='flex-row justify-between'>
      <Text className='text-[12px] 2xs:text-base'>
        Precio x ton: <Text className='font-semibold'>S/ {formatearMonto(precioTonelada)}</Text>
      </Text>
      <Text className='text-[12px] 2xs:text-base'>
        Pago: <Text className='font-semibold'>S/ {formatearMonto(pagoTrabajador())}</Text>
      </Text>
    </View>

  </View>
}