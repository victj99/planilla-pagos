import { Text, View } from 'react-native'
import ActionSheet, { ScrollView, SheetProps } from 'react-native-actions-sheet'
import { Divider, List } from 'react-native-paper'

export default function DetalleReporteDiaSheet({ payload }: SheetProps<'detalle-reporte-dia-sheet'>) {
  return <ActionSheet
    containerStyle={{ minHeight: 300, paddingHorizontal: 10 }}
  >
    <Text className='text-2xl mt-2 font-semibold text-purple-500'>
      {payload?.diaSemana}
    </Text>
    <Divider className='my-1' />

    <View className='max-h-[400]'>
      <Text>Productos procesados:</Text>

      <ScrollView>
        {payload!.detalle.map((item, idx) => <List.Item
          key={'detpago' + idx}
          className='mb-2 bg-gray-100'
          title={<Text>
            {item.nombreProducto}
            <Text className='text-[12px]'> ({item.toneladasProcesadas}t / {item.totalColaboradores})</Text>
          </Text>}
          right={() => <Text className='font-bold'>S/ {item.pagoTotal}</Text>}
        />)}
      </ScrollView>

      <Divider className='my-2' />
      <View className='flex-row justify-between'>
        <Text>Pago Total: </Text>
        <Text className='font-bold text-purple-700 mr-5'>S/ {payload?.pagoTotalDia}</Text>
      </View>
    </View>
  </ActionSheet>
}