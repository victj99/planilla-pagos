import SeparatorView from '@/components/Separator'
import { FilaCuadre, obtenerCuadrePlanilla } from '@/lib/database.service'
import { formatearMonto, isValidNumber } from '@/lib/utils'
import Big from 'big.js'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { ActivityIndicator, Card, DataTable, Divider, Text, TextInput } from 'react-native-paper'

export default function CuadreView() {
  const router = useRouter()
  const { idPlanilla } = useLocalSearchParams()

  const [isPending, setIsPending] = useState(true)
  const [filas, setFilas] = useState<FilaCuadre[]>([])
  const [totalEsperado, setTotalEsperado] = useState(0)
  const [montoRecibido, setMontoRecibido] = useState('')

  async function onInit() {
    const cuadre = await obtenerCuadrePlanilla(+idPlanilla)
    setFilas(cuadre.filas)
    setTotalEsperado(cuadre.totalEsperado)
    setIsPending(false)
  }

  useEffect(() => { onInit() }, [])

  if (isPending) {
    return <View className='h-full justify-center items-center'>
      <ActivityIndicator size='large' />
      <SeparatorView />
      <Text className='text-lg'>Calculando cuadre</Text>
    </View>
  }

  const recibidoValido = isValidNumber(montoRecibido) && montoRecibido.trim() !== ''
  const diferenciaRecibido = recibidoValido ? new Big(montoRecibido).minus(totalEsperado).round(2).toNumber() : 0

  return <ScrollView className='px-2 pt-2'>
    {/* Comparación con el monto recibido (en vivo, no se guarda) */}
    <Card className='mb-3'>
      <Card.Content>
        <Text variant='titleSmall' className='mb-2'>Comparar con lo recibido</Text>
        <TextInput
          label='Monto recibido (S/)'
          value={montoRecibido}
          onChangeText={setMontoRecibido}
          inputMode='decimal'
          dense
        />
        <SeparatorView height={10} />
        <Linea etiqueta='Esperado (toneladas × precio)' valor={totalEsperado} />
        {recibidoValido && <>
          <Linea etiqueta='Recibido' valor={new Big(montoRecibido).toNumber()} />
          <Divider className='my-1' />
          <Linea
            etiqueta='Diferencia'
            valor={diferenciaRecibido}
            color={diferenciaRecibido === 0 ? 'text-green-700' : 'text-red-700'}
          />
        </>}
      </Card.Content>
    </Card>

    {/* Detalle por sesión */}
    <Card>
      <Card.Content>
        <Text variant='titleSmall' className='mb-1'>Por sesión</Text>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Sesión</DataTable.Title>
            <DataTable.Title numeric>Esperado</DataTable.Title>
            <DataTable.Title numeric>Asignado</DataTable.Title>
            <DataTable.Title numeric>Dif.</DataTable.Title>
          </DataTable.Header>

          {filas.map(f => <DataTable.Row
            key={f.idProductoProcesado}
            onPress={() => router.navigate({ pathname: '/planilla/detalle-proceso/[idProductoProcesado]', params: { idProductoProcesado: String(f.idProductoProcesado) } })}
          >
            <DataTable.Cell>{f.etiqueta}</DataTable.Cell>
            <DataTable.Cell numeric>{f.esperado}</DataTable.Cell>
            <DataTable.Cell numeric>{f.asignado}</DataTable.Cell>
            <DataTable.Cell numeric>
              <Text className={f.diferencia === 0 ? 'text-green-700' : 'text-red-700'}>{f.diferencia}</Text>
            </DataTable.Cell>
          </DataTable.Row>)}
        </DataTable>
        <Text className='text-gray-500 text-xs mt-2'>Toca una sesión para ver el detalle. Dif. ≠ 0 indica remanente sin repartir o sobre-asignado.</Text>
      </Card.Content>
    </Card>
    <SeparatorView height={40} />
  </ScrollView>
}

function Linea({ etiqueta, valor, color }: { etiqueta: string, valor: number, color?: string }) {
  return <View className='flex-row justify-between'>
    <Text>{etiqueta}</Text>
    <Text className={`font-semibold ${color ?? ''}`}>S/ {formatearMonto(valor)}</Text>
  </View>
}
