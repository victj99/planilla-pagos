import { REQUIRED_RULE } from '@/constants/Misc'
import { insertarTrabajador, insertarTrabajadorProceso, obtenerTrabajadoresPorNombre, obtenerTrabajadorProcesoByParams } from '@/lib/database.service'
import { TrabajadorSelect } from '@/lib/db/trabajador'
import { TrabajadorProcesoInsert } from '@/lib/db/trabajadorProceso'
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
    SheetManager.hide('agregar-trabajador-proceso-sheet')
  }

  return <ActionSheet containerStyle={{ height: 350, padding: 10 }}>

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

    <View className='mt-4'>
      <Button mode='contained-tonal' onPress={handleSubmit(submit)}>Agregar</Button>
    </View>
  </ActionSheet>
}

interface AutocompleteTrabajadorProps {
  onSelect: (value?: TrabajadorSelect) => void
  value?: number
  error?: string
}
function AutocompleteTrabajador({ onSelect, value, error }: AutocompleteTrabajadorProps) {
  const [completado, setCompletado] = useState(false)
  const [nombre, setNombre] = useState('')
  const [trabajadores, setTrabajadores] = useState<TrabajadorSelect[]>([])

  function onWrite(text: string) {
    if (completado) {
      setCompletado(false)
      onSelect(undefined)
    }

    setNombre(text)

    const listaTrabajadores = obtenerTrabajadoresPorNombre(`%${text}%`)
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

  async function registrarTrabajador() {
    // await db.delete(productoTable)
    const idNuevoTrabajador = await insertarTrabajador({ nombre: nombre.trim() })
    onItemSelect({ id: idNuevoTrabajador, nombre, })
  }

  return <>
    <TextInput
      label='Trabajador'
      value={nombre}
      onChangeText={onWrite}
      right={(nombre.length > 0 && trabajadores.length === 0 && !completado) && <TextInput.Icon icon='plus' onPress={registrarTrabajador} />}
    />
    {!completado && error && <HelperText type='error'>{error}</HelperText>}

    {nombre.length > 0 && trabajadores.length === 0 && !completado && <HelperText type='info'>No hay resultados</HelperText>}

    <ScrollView>
      {trabajadores.map((item, idx) => <List.Item
        title={item.nombre}
        key={'prodItem' + idx}
        className='bg-gray-50 mb-1'
        onPress={() => onItemSelect(item)}
      />)}
    </ScrollView>
  </>
}