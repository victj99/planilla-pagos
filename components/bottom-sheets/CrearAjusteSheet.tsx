import { motivosAjusteOpts } from '@/constants/Misc'
import { actualizarAjuste, insertarAjuste, obtenerTrabajadoresDePlanilla } from '@/lib/database.service'
import { isValidNumber } from '@/lib/utils'
import * as Haptics from 'expo-haptics'
import { useMemo, useState } from 'react'
import { View } from 'react-native'
import ActionSheet, { ScrollView, SheetManager, SheetProps } from 'react-native-actions-sheet'
import { Button, Chip, HelperText, SegmentedButtons, TextInput, Text as TextPaper } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import SeparatorView from '../Separator'
import { AutocompleteTrabajador } from './AgregarTrabajadorProcesoSheet'

export default function CrearAjusteSheet({ payload }: SheetProps<'crear-ajuste-sheet'>) {
  const insets = useSafeAreaInsets()
  const ajuste = payload?.ajuste

  const trabajadoresPlanilla = useMemo(
    () => payload ? obtenerTrabajadoresDePlanilla(payload.idPlanilla) : [],
    [payload]
  )

  const [idTrabajador, setIdTrabajador] = useState<number | undefined>(ajuste?.idTrabajador)
  const [signo, setSigno] = useState(ajuste && ajuste.monto > 0 ? '+' : '-')
  const [montoAbs, setMontoAbs] = useState(ajuste ? String(Math.abs(ajuste.monto)) : '')
  const [motivo, setMotivo] = useState(ajuste?.motivo ?? motivosAjusteOpts[0].value)
  const [nota, setNota] = useState(ajuste?.nota ?? '')
  const [intentado, setIntentado] = useState(false)

  const montoValido = isValidNumber(montoAbs) && +montoAbs > 0

  async function submit() {
    setIntentado(true)
    if (idTrabajador === undefined || !montoValido) return

    const monto = (signo === '-' ? -1 : 1) * Number(montoAbs)

    if (ajuste) {
      await actualizarAjuste(ajuste.id, { monto, motivo, nota: nota.trim() || null })
    } else {
      await insertarAjuste({ idPlanillaSemanal: payload!.idPlanilla, idTrabajador, monto, motivo, nota: nota.trim() || null })
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    SheetManager.hide('crear-ajuste-sheet')
  }

  return <ActionSheet containerStyle={{ padding: 12 }} safeAreaInsets={insets} gestureEnabled>
    <ScrollView keyboardShouldPersistTaps='handled'>
    <TextPaper variant='titleMedium'>{ajuste ? 'Editar ajuste' : 'Nuevo ajuste'}</TextPaper>
    <SeparatorView height={12} />

    {!ajuste && <>
      {trabajadoresPlanilla.length === 0
        ? <HelperText type='info'>Esta planilla aún no tiene trabajadores. Agrégalos primero en los días de la planilla.</HelperText>
        : <AutocompleteTrabajador
          value={idTrabajador}
          error={intentado && idTrabajador === undefined ? 'Seleccione un trabajador' : undefined}
          onSelect={(t) => setIdTrabajador(t?.id)}
          opciones={trabajadoresPlanilla}
          listaInline
        />}
      <SeparatorView height={12} />
    </>}

    <SegmentedButtons
      value={signo}
      onValueChange={setSigno}
      buttons={[
        { value: '-', label: 'Descontar', icon: 'minus' },
        { value: '+', label: 'Agregar', icon: 'plus' },
      ]}
    />
    <SeparatorView height={12} />

    <TextInput
      label='Monto (S/)'
      value={montoAbs}
      onChangeText={setMontoAbs}
      inputMode='decimal'
      left={<TextInput.Affix text={signo} />}
    />
    {intentado && !montoValido && <HelperText type='error'>Ingrese un monto válido mayor a cero</HelperText>}
    <SeparatorView height={12} />

    <TextPaper variant='labelLarge' className='mb-1'>Motivo</TextPaper>
    <View className='flex-row flex-wrap gap-2'>
      {motivosAjusteOpts.map(opt => <Chip
        key={opt.value}
        selected={motivo === opt.value}
        showSelectedCheck
        onPress={() => setMotivo(opt.value)}
      >{opt.label}</Chip>)}
    </View>
    <SeparatorView height={12} />

    <TextInput label='Nota (opcional)' value={nota} onChangeText={setNota} />
    <SeparatorView height={16} />

    <Button mode='contained-tonal' onPress={submit}>{ajuste ? 'Guardar' : 'Agregar ajuste'}</Button>
    </ScrollView>
  </ActionSheet>
}
