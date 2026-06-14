import { REQUIRED_RULE } from '@/constants/Misc'
import { insertarTrabajador, insertarTrabajadorProceso, obtenerTrabajadores, obtenerTrabajadoresPorNombre, obtenerTrabajadorProcesoByParams } from '@/lib/database.service'
import { TrabajadorSelect } from '@/lib/db/trabajador'
import { TrabajadorProcesoInsert } from '@/lib/db/trabajadorProceso'
import { normalizarNombre, normalizarParaBusqueda, sonNombresSimilares } from '@/lib/utils'
import * as Haptics from 'expo-haptics'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Alert, View } from 'react-native'
import ActionSheet, { ScrollView, SheetManager, SheetProps } from 'react-native-actions-sheet'
import { Button, HelperText, List, TextInput, Text as TextPaper } from 'react-native-paper'
import SeparatorView from '../Separator'


export default function AgregarTrabajadorProcesoSheet({ payload }: SheetProps<'agregar-trabajador-proceso-sheet'>) {
  const { control, handleSubmit } = useForm<TrabajadorProcesoInsert>({
    defaultValues: { toneladasProcesadas: 0, idProductoProcesado: payload?.idProductoProcesado, totalColaboradores: 0 }
  })

  async function submit(data: TrabajadorProcesoInsert) {

    // Validamos que el trabajador no exista
    const trabajadorExistente = await obtenerTrabajadorProcesoByParams(data.idTrabajador, payload!.idProductoProcesado)
    if (trabajadorExistente) {
      Alert.alert('Error', 'El trabajador ya se encuentra agregado')
      return
    }

    await insertarTrabajadorProceso(data)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    SheetManager.hide('agregar-trabajador-proceso-sheet')
  }

  return <ActionSheet containerStyle={{ height: 400, padding: 10 }} gestureEnabled>

    <TextPaper variant='titleMedium'>Agregar trabajador</TextPaper>
    <SeparatorView height={15} />

    <Controller
      rules={REQUIRED_RULE}
      control={control} name='idTrabajador'
      render={({ field, fieldState }) => <>
        <AutocompleteTrabajador
          value={field.value}
          error={fieldState.error?.message}
          onSelect={(value) => field.onChange(value?.id)}
        />
      </>}
    />

    <View className='mt-4 mb-3'>
      <Button mode='contained-tonal' onPress={handleSubmit(submit)}>Agregar</Button>
    </View>
  </ActionSheet>
}

interface AutocompleteTrabajadorProps {
  onSelect: (value?: TrabajadorSelect) => void
  value?: number
  error?: string
  // Si se pasa, la búsqueda se limita a esta lista y se oculta la opción de crear nuevo
  opciones?: TrabajadorSelect[]
  // Renderiza los resultados directos (sin ScrollView interno) para usar dentro de un sheet ya scrolleable
  listaInline?: boolean
}
export function AutocompleteTrabajador({ onSelect, value, error, opciones, listaInline }: AutocompleteTrabajadorProps) {
  const [completado, setCompletado] = useState(false)
  const [nombre, setNombre] = useState('')
  const [trabajadores, setTrabajadores] = useState<TrabajadorSelect[]>([])

  const permiteCrear = opciones === undefined

  function onWrite(text: string) {
    if (completado) {
      setCompletado(false)
      onSelect(undefined)
    }

    setNombre(text)

    if (opciones) {
      const consulta = normalizarParaBusqueda(text)
      setTrabajadores(consulta
        ? opciones.filter(t => normalizarParaBusqueda(t.nombre).includes(consulta) || (t.alias ? normalizarParaBusqueda(t.alias).includes(consulta) : false))
        : opciones)
      return
    }

    const listaTrabajadores = obtenerTrabajadoresPorNombre(text)
    setTrabajadores(listaTrabajadores)
  }

  function onItemSelect(value: TrabajadorSelect) {
    setCompletado(true)

    setNombre(value.nombre)
    onSelect(value)
    setTrabajadores([])
  }

  function onBlur() {
    if (nombre.length > 0 && value === undefined) {
      setNombre('')
    }
    setTrabajadores([])
  }

  async function crear() {
    const nombreNormalizado = normalizarNombre(nombre)
    const idNuevoTrabajador = await insertarTrabajador({ nombre: nombreNormalizado })
    onItemSelect({ id: idNuevoTrabajador, nombre: nombreNormalizado, alias: null, activo: true })
  }

  async function registrarTrabajador() {
    // Aviso de posibles duplicados antes de crear
    const similar = obtenerTrabajadores(true).find(t => sonNombresSimilares(t.nombre, nombre))

    if (similar) {
      Alert.alert(
        'Posible duplicado',
        `Ya existe "${similar.nombre}". ¿Crear "${normalizarNombre(nombre)}" de todos modos?`,
        [
          { text: 'Usar existente', onPress: () => onItemSelect(similar) },
          { text: 'Crear nuevo', onPress: () => crear() },
        ]
      )
      return
    }

    await crear()
  }

  return <>
    <TextInput
      label='Trabajador'
      value={nombre}
      onChangeText={onWrite}
      right={(permiteCrear && nombre.length > 0 && trabajadores.length === 0 && !completado) && <TextInput.Icon icon='plus' onPress={registrarTrabajador} />}
    />
    {!completado && error && <HelperText type='error'>{error}</HelperText>}

    {nombre.length > 0 && trabajadores.length === 0 && !completado && <HelperText type='info'>{permiteCrear ? 'No hay resultados' : 'No está en esta planilla'}</HelperText>}

    {listaInline
      ? trabajadores.map((item, idx) => <List.Item
        title={item.nombre}
        key={'prodItem' + idx}
        className='bg-gray-50 mb-1'
        onPress={() => onItemSelect(item)}
      />)
      : <ScrollView style={{ maxHeight: 260 }} keyboardShouldPersistTaps='handled'>
        {trabajadores.map((item, idx) => <List.Item
          title={item.nombre}
          key={'prodItem' + idx}
          className='bg-gray-50 mb-1'
          onPress={() => onItemSelect(item)}
        />)}
      </ScrollView>}
  </>
}