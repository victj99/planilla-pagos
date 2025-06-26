import { diasSemanaOpts, SelectOption } from '@/constants/Misc'
import { FlashList } from '@shopify/flash-list'
import { View } from 'react-native'
import ActionSheet, { SheetManager, SheetProps } from 'react-native-actions-sheet'
import { Icon, List, MD3Colors, Text } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import SeparatorView from '../Separator'

export default function ElegirDiaSheet({ payload }: SheetProps<'elegir-dia-sheet'>) {
  const insets = useSafeAreaInsets()
  function onSelect(value: SelectOption) {
    SheetManager.hide('elegir-dia-sheet', { payload: value, })
  }

  return <ActionSheet containerStyle={{ padding: 10 }} safeAreaInsets={insets}>

    <Text variant='titleMedium' style={{ color: MD3Colors.primary40 }}>Elegir dia</Text>
    <SeparatorView />

    <View style={{ height: 180 }}>
      <FlashList
        estimatedItemSize={200}
        data={diasSemanaOpts}
        ItemSeparatorComponent={() => <SeparatorView />}
        renderItem={({ item }) => <List.Item
          title={item.label}
          onPress={() => onSelect(item)}
          right={() => (item.value === payload?.value) ? <Icon source='check' size={20} color='green' /> : null}
        />}
      />
    </View>

  </ActionSheet>
}