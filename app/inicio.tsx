import { obtenerPlanillasSemanales } from '@/lib/database.service'
import { PlanillaSemanalSelect } from '@/lib/db/planillaSemanal'
import { formatDate } from '@/lib/utils'
import { FlashList } from "@shopify/flash-list"
import * as NavigationBar from 'expo-navigation-bar'
import { useNavigation, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { GestureResponderEvent, Text, View } from 'react-native'
import { SheetManager } from 'react-native-actions-sheet'
import { Card, IconButton } from 'react-native-paper'

interface BotonProps {
  onClick: (e: GestureResponderEvent) => void
}

function BotonAgregarCuenta({ onClick }: BotonProps) {
  return <IconButton icon='plus' mode='contained-tonal' onPress={onClick} />

}

export default function MainView() {
  const router = useRouter()
  const navigation = useNavigation()
  const [planillas, setPlanillas] = useState<PlanillaSemanalSelect[]>([])

  async function abrirFormPlanilla() {
    await SheetManager.show('crear-planilla-sheet')
    listarPlanillas()
  }

  function listarPlanillas() {
    const lista = obtenerPlanillasSemanales()
    setPlanillas(lista)
  }

  function abrirPlanilla(id: number) {
    router.navigate({ pathname: '/planilla/[id]', params: { id: id } })
  }

  useEffect(() => {
    try {
      NavigationBar.setStyle('inverted')
    } catch (error) { }

    navigation.setOptions({
      headerRight: () => <BotonAgregarCuenta onClick={() => abrirFormPlanilla()} />
    })

    listarPlanillas()
  }, [navigation])

  return <View className='h-full pb-safe'>
    <FlashList
      estimatedItemSize={200}
      data={planillas}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} ></View>}
      renderItem={({ item }) => <Card className='mx-2 border-purple-400 border' onPress={() => abrirPlanilla(item.id)}>
        <Card.Title title={item.nombre} />
        <Card.Content>
          <Text>{formatDate(item.creacion!)}</Text>
        </Card.Content>
      </Card>}
    />
  </View>
}