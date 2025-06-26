import { View } from 'react-native'

interface Props {
  height?: number
}
export default function SeparatorView({ height = 10 }: Props) {
  return <View style={{ height }} ></View>
}