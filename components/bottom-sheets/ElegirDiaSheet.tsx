import { diasSemanaOpts, SelectOption } from '@/constants/Misc'
import { View } from 'react-native'
import ActionSheet, { ScrollView, SheetManager, SheetProps } from 'react-native-actions-sheet'
import { Divider, Icon, List, MD3Colors, Text } from 'react-native-paper'
import SeparatorView from '../Separator'

export default function ElegirDiaSheet({ payload }: SheetProps<'elegir-dia-sheet'>) {
  function onSelect(value: SelectOption) {
    SheetManager.hide('elegir-dia-sheet', { payload: value, })
  }

  return <ActionSheet containerStyle={{ paddingHorizontal: 10, borderColor: '#7C3AED', borderStyle: 'solid', borderWidth: 2 }}>

    <Text variant='titleMedium' className='pt-1 pb-1' style={{ color: MD3Colors.primary40 }}>Elegir dia</Text>
    <Divider />

    <View style={{ height: 220 }}>
      <ScrollView>
        {diasSemanaOpts.map((item, idx) => <View key={item.value}>
          {idx > 0 && <SeparatorView />}
          <List.Item
            title={item.label}
            onPress={() => onSelect(item)}
            right={() => (item.value === payload?.value) ? <Icon source='check' size={20} color='green' /> : null}
          />
        </View>)}
      </ScrollView>
    </View>

  </ActionSheet>
}
