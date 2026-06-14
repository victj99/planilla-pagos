import EmptyState from '@/components/EmptyState'
import SeparatorView from '@/components/Separator'
import { eliminarAjuste, listarAjustesPorPlanilla } from '@/lib/database.service'
import { formatearMonto } from '@/lib/utils'
import * as Haptics from 'expo-haptics'
import { useFocusEffect, useLocalSearchParams } from 'expo-router'
import { useCallback, useState } from 'react'
import { Alert, ScrollView, View } from 'react-native'
import { SheetManager } from 'react-native-actions-sheet'
import { Card, Divider, FAB, IconButton, List, Text } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Ajuste = ReturnType<typeof listarAjustesPorPlanilla>[number]

export default function AjustesView() {
  const insets = useSafeAreaInsets()
  const { idPlanilla } = useLocalSearchParams()
  const [ajustes, setAjustes] = useState<Ajuste[]>([])

  const recargar = useCallback(() => {
    setAjustes(listarAjustesPorPlanilla(+idPlanilla))
  }, [idPlanilla])

  useFocusEffect(useCallback(() => { recargar() }, [recargar]))

  async function abrirSheet(ajuste?: Ajuste) {
    await SheetManager.show('crear-ajuste-sheet', {
      payload: {
        idPlanilla: +idPlanilla,
        ajuste: ajuste && { id: ajuste.id, idTrabajador: ajuste.idTrabajador, monto: ajuste.monto, motivo: ajuste.motivo, nota: ajuste.nota },
      },
    })
    recargar()
  }

  function eliminar(ajuste: Ajuste) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    Alert.alert('Confirmar', '¿Eliminar este ajuste?', [
      { text: 'No' },
      { text: 'Sí', onPress: async () => { await eliminarAjuste(ajuste.id); recargar() } },
    ])
  }

  // Agrupar por trabajador
  const grupos = new Map<number, { nombre: string, total: number, items: Ajuste[] }>()
  for (const a of ajustes) {
    if (!grupos.has(a.idTrabajador)) grupos.set(a.idTrabajador, { nombre: a.nombreTrabajador, total: 0, items: [] })
    const g = grupos.get(a.idTrabajador)!
    g.total += a.monto
    g.items.push(a)
  }

  return <View className='h-full pb-safe'>
    {ajustes.length === 0
      ? <EmptyState
          icon='cash-plus'
          title='Sin ajustes esta semana'
          description='Agrega préstamos, castigos o suspensiones con el botón +'
          actionLabel='Agregar ajuste'
          onAction={() => abrirSheet()}
        />
      : <ScrollView className='px-2 pt-2'>
        {[...grupos.values()].map(grupo => <Card key={grupo.nombre} className='mb-3'>
          <Card.Title
            title={grupo.nombre}
            right={() => <Text className={`mr-4 font-bold ${grupo.total < 0 ? 'text-red-700' : 'text-green-700'}`}>
              {grupo.total < 0 ? '−' : '+'} S/ {formatearMonto(Math.abs(grupo.total))}
            </Text>}
          />
          <Divider />
          {grupo.items.map(item => <List.Item
            key={item.id}
            title={item.motivo}
            description={item.nota || undefined}
            onPress={() => abrirSheet(item)}
            left={() => <Text className={`self-center ml-4 w-20 font-semibold ${item.monto < 0 ? 'text-red-700' : 'text-green-700'}`}>
              {item.monto < 0 ? '−' : '+'} S/ {formatearMonto(Math.abs(item.monto))}
            </Text>}
            right={() => <IconButton icon='delete' onPress={() => eliminar(item)} accessibilityLabel='Eliminar ajuste' />}
          />)}
        </Card>)}
        <SeparatorView height={80} />
      </ScrollView>}

    <FAB
      icon='plus'
      style={{ position: 'absolute', right: 16, bottom: insets.bottom + 16 }}
      onPress={() => abrirSheet()}
      accessibilityLabel='Agregar ajuste'
    />
  </View>
}
