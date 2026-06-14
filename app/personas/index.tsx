import EmptyState from '@/components/EmptyState'
import SeparatorView from '@/components/Separator'
import { FlashList } from '@shopify/flash-list'
import { actualizarTrabajador, archivarTrabajador, fusionarTrabajadores, obtenerTrabajadores } from '@/lib/database.service'
import { TrabajadorSelect } from '@/lib/db/trabajador'
import { normalizarParaBusqueda } from '@/lib/utils'
import * as Haptics from 'expo-haptics'
import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { View } from 'react-native'
import { Button, Checkbox, Dialog, Divider, IconButton, List, Portal, RadioButton, Searchbar, Text, TextInput } from 'react-native-paper'

export default function PersonasView() {
  const [trabajadores, setTrabajadores] = useState<TrabajadorSelect[]>([])
  const [query, setQuery] = useState('')
  const [modoFusion, setModoFusion] = useState(false)
  const [seleccion, setSeleccion] = useState<number[]>([])

  const [editando, setEditando] = useState<TrabajadorSelect | null>(null)
  const [dialogFusion, setDialogFusion] = useState(false)

  const recargar = useCallback(() => {
    setTrabajadores(obtenerTrabajadores(false))
  }, [])

  useFocusEffect(useCallback(() => { recargar() }, [recargar]))

  const consulta = normalizarParaBusqueda(query)
  const filtrados = consulta
    ? trabajadores.filter(t =>
      normalizarParaBusqueda(t.nombre).includes(consulta) ||
      (t.alias ? normalizarParaBusqueda(t.alias).includes(consulta) : false))
    : trabajadores

  function toggleSeleccion(id: number) {
    setSeleccion(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function salirFusion() {
    setModoFusion(false)
    setSeleccion([])
  }

  async function archivar(t: TrabajadorSelect) {
    await archivarTrabajador(t.id, !t.activo)
    recargar()
  }

  async function fusionar(idCanonico: number) {
    await fusionarTrabajadores(idCanonico, seleccion)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setDialogFusion(false)
    salirFusion()
    recargar()
  }

  const seleccionados = trabajadores.filter(t => seleccion.includes(t.id))

  return <View className='h-full pb-safe'>
    <Searchbar
      placeholder='Buscar persona'
      value={query}
      onChangeText={setQuery}
      className='m-2'
    />

    <View className='flex-row justify-between items-center mx-3 mb-1'>
      <Text variant='labelLarge'>{filtrados.length} personas</Text>
      {modoFusion
        ? <View className='flex-row items-center'>
          <Button onPress={salirFusion}>Cancelar</Button>
          <Button
            mode='contained-tonal'
            disabled={seleccion.length < 2}
            onPress={() => setDialogFusion(true)}
          >Fusionar ({seleccion.length})</Button>
        </View>
        : <Button icon='merge' onPress={() => setModoFusion(true)}>Fusionar duplicados</Button>}
    </View>
    <Divider />

    <View className='flex-1'>
      <FlashList
        data={filtrados}
        keyExtractor={item => String(item.id)}
        ListEmptyComponent={
          <EmptyState
            icon={query ? 'account-search' : 'account-group'}
            title={query ? 'Sin resultados' : 'Sin personas registradas'}
            description={query ? `No hay coincidencias para "${query}".` : 'Las personas se crean automáticamente al registrar trabajos.'}
          />
        }
        renderItem={({ item }) => <List.Item
          title={item.nombre}
          description={item.alias ? `Alias: ${item.alias}` : (item.activo ? undefined : 'Archivado')}
          titleStyle={!item.activo ? { color: '#999' } : undefined}
          onPress={modoFusion ? () => toggleSeleccion(item.id) : undefined}
          left={props => modoFusion
            ? <Checkbox status={seleccion.includes(item.id) ? 'checked' : 'unchecked'} />
            : <List.Icon {...props} icon={item.activo ? 'account' : 'account-off'} />}
          right={() => modoFusion ? null : <View className='flex-row'>
            <IconButton icon='pencil' onPress={() => setEditando(item)} accessibilityLabel='Editar persona' />
            <IconButton
              icon={item.activo ? 'archive-arrow-down' : 'archive-arrow-up'}
              onPress={() => archivar(item)}
              accessibilityLabel={item.activo ? 'Archivar persona' : 'Reactivar persona'}
            />
          </View>}
        />}
      />
    </View>

    <Portal>
      <EditarPersonaDialog
        trabajador={editando}
        onDismiss={() => setEditando(null)}
        onGuardado={() => { setEditando(null); recargar() }}
      />

      <Dialog visible={dialogFusion} onDismiss={() => setDialogFusion(false)}>
        <Dialog.Title>Elegir nombre a conservar</Dialog.Title>
        <Dialog.Content>
          <Text className='mb-2'>El historial de los demás se moverá a la persona elegida y los duplicados se eliminarán.</Text>
          <FusionPicker seleccionados={seleccionados} onConfirmar={fusionar} />
        </Dialog.Content>
      </Dialog>
    </Portal>
  </View>
}

interface EditarPersonaDialogProps {
  trabajador: TrabajadorSelect | null
  onDismiss: () => void
  onGuardado: () => void
}
function EditarPersonaDialog({ trabajador, onDismiss, onGuardado }: EditarPersonaDialogProps) {
  const [nombre, setNombre] = useState('')
  const [alias, setAlias] = useState('')

  // Sincroniza al abrir
  const idActual = trabajador?.id
  const [ultimoId, setUltimoId] = useState<number | undefined>(undefined)
  if (idActual !== ultimoId) {
    setUltimoId(idActual)
    setNombre(trabajador?.nombre ?? '')
    setAlias(trabajador?.alias ?? '')
  }

  async function guardar() {
    if (!trabajador || !nombre.trim()) return
    await actualizarTrabajador(trabajador.id, { nombre, alias: alias.trim() || null })
    onGuardado()
  }

  return <Dialog visible={!!trabajador} onDismiss={onDismiss}>
    <Dialog.Title>Editar persona</Dialog.Title>
    <Dialog.Content>
      <TextInput label='Nombre' value={nombre} onChangeText={setNombre} />
      <SeparatorView />
      <TextInput label='Alias (opcional)' value={alias} onChangeText={setAlias} />
    </Dialog.Content>
    <Dialog.Actions>
      <Button onPress={onDismiss}>Cancelar</Button>
      <Button onPress={guardar} disabled={!nombre.trim()}>Guardar</Button>
    </Dialog.Actions>
  </Dialog>
}

interface FusionPickerProps {
  seleccionados: TrabajadorSelect[]
  onConfirmar: (idCanonico: number) => void
}
function FusionPicker({ seleccionados, onConfirmar }: FusionPickerProps) {
  const [idCanonico, setIdCanonico] = useState<number | null>(seleccionados[0]?.id ?? null)

  return <View>
    <RadioButton.Group
      onValueChange={v => setIdCanonico(+v)}
      value={idCanonico != null ? String(idCanonico) : ''}
    >
      {seleccionados.map(t => <RadioButton.Item key={t.id} label={t.nombre} value={String(t.id)} />)}
    </RadioButton.Group>
    <Button
      mode='contained'
      className='mt-2'
      disabled={idCanonico == null}
      onPress={() => idCanonico != null && onConfirmar(idCanonico)}
    >Fusionar</Button>
  </View>
}
