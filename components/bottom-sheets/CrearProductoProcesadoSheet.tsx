import { REQUIRED_DECIMAL, REQUIRED_RULE } from '@/constants/Misc'
import { actualizarPrecioProducto, actualizarProductoProcesado, insertarProducto, insertarProductoProcesado, obtenerProducto, obtenerProductoProcesado, obtenerProductosPorNombre } from '@/lib/database.service'
import { ProductoSelect } from '@/lib/db/producto'
import { ProductoProcesadoInsert } from '@/lib/db/productoProcesado'
import { labelDiaSemana } from '@/lib/utils'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Alert, Platform, ScrollView, View } from 'react-native'
import ActionSheet, { SheetManager, SheetProps } from 'react-native-actions-sheet'
import { Button, HelperText, List, TextInput, Text as TextPaper, TouchableRipple } from 'react-native-paper'
import SeparatorView from '../Separator'
import TextInputForm from '../form/TextInputForm'


export default function CrearProductoProcesadoSheet({ payload }: SheetProps<'crear-producto-procesado-sheet'>) {
  const productoProcesado = useMemo(
    () => payload?.id ? obtenerProductoProcesado(payload?.id) : undefined,
    [payload?.id]
  )

  const { control, setValue, getValues, handleSubmit } = useForm<ProductoProcesadoInsert>({
    defaultValues: {
      id: productoProcesado?.id,
      diaSemana: productoProcesado?.diaSemana || 'J',
      idPlanillaSemanal: productoProcesado?.idPlanillaSemanal || payload?.idPlanilla,
      toneladas: productoProcesado?.toneladas || 0,
      precioTonelada: productoProcesado?.precioTonelada || 0,
      etiqueta: productoProcesado?.etiqueta || ''
    }
  })


  async function submit(data: ProductoProcesadoInsert) {
    if (data.id) {
      await actualizarProductoProcesado(data)
      SheetManager.hide('crear-producto-procesado-sheet')

      return
    }

    Alert.alert('Confirmar', '¿Desea agregar el producto procesado?', [
      { text: 'No' },
      { isPreferred: true, text: 'Si', onPress: () => crearNuevoProductoProcesado(data) },
    ])
  }

  async function seleccionarDiaSemana(value: string) {
    const resp = await SheetManager.show('elegir-dia-sheet', { payload: { value } })
    if (resp) setValue('diaSemana', resp.value)
  }

  async function crearNuevoProductoProcesado(data: ProductoProcesadoInsert) {
    await insertarProductoProcesado(data)
    await actualizarPrecioProducto(data.idProducto, data.precioTonelada)
    SheetManager.hide('crear-producto-procesado-sheet')
  }

  return <ActionSheet containerStyle={{ height: 450, padding: 10 }}>

    {!productoProcesado && <TextPaper variant='titleMedium'>Nuevo producto procesado</TextPaper>}
    {productoProcesado && <TextPaper variant='titleMedium'>Modificar producto</TextPaper>}

    <SeparatorView height={15} />

    <ScrollView>
      <Controller
        control={control} name='diaSemana'
        rules={REQUIRED_RULE}
        render={({ field }) => <TouchableRipple
          onPress={() => seleccionarDiaSemana(field.value)}
        >
          <TextInput
            readOnly
            label='Dia de la semana'
            value={labelDiaSemana(field.value)}
            onPress={() => Platform.OS === 'ios' ? seleccionarDiaSemana(field.value) : null}
          />
        </TouchableRipple>}
      />
      <SeparatorView />

      {!productoProcesado && <Controller
        rules={REQUIRED_RULE}
        control={control} name='idProducto'
        render={({ field, fieldState }) => <>
          <AutocompleteProductos
            value={field.value}
            error={fieldState.error?.message}
            onSelect={(value) => {
              field.onChange(value.id)
              const precioTon = getValues('precioTonelada')
              if (!precioTon || +precioTon === 0) {
                setValue('precioTonelada', value.precioTonelada)
              }
            }}
          />
        </>}
      />}
      <SeparatorView />

      <TextInputForm
        control={control}
        controlName='precioTonelada'
        label='Precio por tonelada'
        inputMode='decimal'
        rules={REQUIRED_DECIMAL}
      />
      <SeparatorView />

      <TextInputForm
        control={control}
        controlName='toneladas'
        label='Toneladas totales procesadas'
        inputMode='decimal'
        rules={REQUIRED_DECIMAL}
      />
      <SeparatorView height={15} />

      <TextInputForm
        control={control}
        controlName='etiqueta'
        label='Etiqueta (opcional)'
        rules={{
          maxLength: { value: 20, message: 'Solo se permite un máximo de 20 letras' }
        }} />
    </ScrollView>

    <View className='mt-4'>
      <Button mode='contained-tonal' onPress={handleSubmit(submit)}>
        {productoProcesado ? 'Modificar' : 'Crear'}
      </Button>
    </View>
  </ActionSheet>
}

interface AutocompleteProductosProps {
  onSelect: (value: ProductoSelect) => void
  value?: number
  error?: string
}
function AutocompleteProductos({ onSelect, value, error }: AutocompleteProductosProps) {
  const [completado, setCompletado] = useState(false)
  const [nombre, setNombre] = useState(obtenerNombreProducto())
  const [productos, setProductos] = useState<ProductoSelect[]>([])

  function onWrite(value: string) {
    if (completado) setCompletado(false)

    setNombre(value)

    const listaProds = obtenerProductosPorNombre(`%${value}%`)
    setProductos(listaProds)
  }

  function obtenerNombreProducto(): string {
    if (value === undefined) return ''
    return obtenerProducto(value)?.nombre || ''
  }

  function onItemSelect(value: ProductoSelect) {
    setCompletado(true)

    setNombre(value.nombre)
    onSelect(value)
    setProductos([])
  }

  function onBlur() {
    if (nombre.length > 0 && value === undefined && productos.length > 0) {
      setNombre('')
      setProductos([])
    }
  }

  async function registrarProducto() {
    // await db.delete(productoTable)
    const insertRowId = await insertarProducto({ nombre, precioTonelada: 0 })
    onItemSelect({ id: insertRowId, nombre, precioTonelada: 0 })
  }

  return <>
    <TextInput
      label='Producto'
      value={nombre}
      onBlur={onBlur}
      onFocus={() => onWrite('')}
      onChangeText={onWrite}
      right={(nombre.length > 0 && productos.length === 0 && !completado) && <TextInput.Icon icon='plus' onPress={registrarProducto} />}
    />
    {nombre.length === 0 && error && <HelperText type='error'>{error}</HelperText>}

    {nombre.length > 0 && productos.length === 0 && !completado && <HelperText type='info'>No hay resultados</HelperText>}

    {productos.map((item, idx) => <List.Item
      title={item.nombre}
      key={'prodItem' + idx}
      className='bg-gray-50 mb-1'
      onPress={() => onItemSelect(item)}
    />)}
  </>
}