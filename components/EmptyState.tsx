import { View } from 'react-native'
import { Button, Icon, Text } from 'react-native-paper'

interface EmptyStateProps {
  icon: string
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className='flex-1 items-center justify-center px-8 gap-3'>
      <Icon source={icon} size={64} color='#7C3AED' />
      <Text variant='titleMedium' className='text-center font-semibold'>
        {title}
      </Text>
      {description && (
        <Text variant='bodyMedium' className='text-center' style={{ color: '#6B7280' }}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button mode='contained-tonal' onPress={onAction} className='mt-2'>
          {actionLabel}
        </Button>
      )}
    </View>
  )
}
