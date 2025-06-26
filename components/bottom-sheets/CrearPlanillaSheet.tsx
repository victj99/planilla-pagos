import { REQUIRED_MSG } from '@/constants/Messages'
import { insertarPlanillaSemanal } from '@/lib/database.service'
import { PlanillaSemanalInsert } from '@/lib/db/planillaSemanal'
import { useForm } from 'react-hook-form'
import { Alert, View } from 'react-native'
import ActionSheet, { SheetManager } from 'react-native-actions-sheet'
import { Button } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import TextInputForm from '../form/TextInputForm'

export default function CrearPlanillaBottomSheet() {
  const insets = useSafeAreaInsets()
  const { control, handleSubmit } = useForm<PlanillaSemanalInsert>({
    defaultValues: { nombre: '' }
  })

  const rules = { required: { value: true, message: REQUIRED_MSG } }

  function submit(data: PlanillaSemanalInsert) {
    Alert.alert('Confirmar', '¿Dese registrar una nueva planilla de pagos?', [
      { text: 'No' },
      { isPreferred: true, text: 'Si', onPress: () => crearNuevaPlanilla(data) },
    ])
  }

  async function crearNuevaPlanilla(data: PlanillaSemanalInsert) {
    await insertarPlanillaSemanal(data)
    SheetManager.hide('crear-planilla-sheet')
  }

  return <ActionSheet containerStyle={{ height: 250, padding: 10 }} safeAreaInsets={insets}>

    <TextInputForm control={control} controlName='nombre' label='Nombre' rules={rules} />

    <View className='mt-4'>
      <Button mode='contained-tonal' onPress={handleSubmit(submit)}>Crear</Button>
    </View>
  </ActionSheet>
}