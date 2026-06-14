import Big from 'big.js'
import { Parser } from 'expr-eval'
import * as Haptics from 'expo-haptics'
import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import ActionSheet, { SheetManager, SheetProps } from 'react-native-actions-sheet'
import { Button, MD3Colors, Text } from 'react-native-paper'

const parser = new Parser()
const OPERADORES = ['+', '-', '×', '÷']

// Evalúa la expresión visible. Devuelve null si es inválida o incompleta.
function evaluar(expr: string): Big | null {
  // Quitar operador/punto colgante al final y normalizar símbolos
  const limpia = expr.replace(/[+\-×÷.]+$/, '').replace(/×/g, '*').replace(/÷/g, '/')
  if (!limpia) return null
  try {
    const resultado = parser.evaluate(limpia)
    if (typeof resultado !== 'number' || !Number.isFinite(resultado)) return null
    return new Big(resultado)
  } catch {
    return null
  }
}

// Definido a nivel de módulo (tipo estable) para que las teclas NO se remonten en
// cada pulsación; así no se pierden toques al presionar rápido.
function Tecla({ label, onPress, color }: { label: string, onPress: () => void, color?: string }) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: '#00000015' }}
      style={({ pressed }) => [styles.tecla, pressed && styles.teclaPressed]}
    >
      <Text style={[styles.teclaLabel, color ? { color } : null]}>{label}</Text>
    </Pressable>
  )
}

export default function CalculadoraSheet({ payload }: SheetProps<'calculadora-sheet'>) {
  const inicial = payload?.value != null ? `${payload.value}` : ''
  const [expr, setExpr] = useState(inicial)
  const [error, setError] = useState(false)

  function tap() {
    Haptics.selectionAsync()
  }

  function ingresarDigito(d: string) {
    tap()
    setError(false)
    setExpr(prev => prev + d)
  }

  function ingresarPunto() {
    tap()
    setError(false)
    setExpr(prev => {
      // Un solo punto por número (desde el último operador)
      const ultimoNumero = prev.split(/[+\-×÷]/).pop() ?? ''
      if (ultimoNumero.includes('.')) return prev
      return prev === '' || OPERADORES.includes(prev.slice(-1)) ? prev + '0.' : prev + '.'
    })
  }

  function ingresarOperador(op: string) {
    tap()
    setError(false)
    setExpr(prev => {
      if (prev === '') return op === '-' ? '-' : '' // solo '-' al inicio
      // Reemplazar el operador final si ya hay uno
      return OPERADORES.includes(prev.slice(-1)) ? prev.slice(0, -1) + op : prev + op
    })
  }

  function limpiar() {
    tap()
    setError(false)
    setExpr('')
  }

  function borrar() {
    tap()
    setError(false)
    setExpr(prev => prev.slice(0, -1))
  }

  function igual() {
    tap()
    const r = evaluar(expr)
    if (r == null) {
      setError(true)
      return
    }
    setExpr(`${r.round(2)}`)
  }

  function usar() {
    const r = evaluar(expr)
    if (r == null) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      setError(true)
      return
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    SheetManager.hide('calculadora-sheet', { payload: Number(r.round(2)) })
  }

  const display = error ? 'Error' : (expr === '' ? '0' : expr)
  const op = MD3Colors.primary40

  return <ActionSheet containerStyle={{ padding: 12 }}>
    <Text variant='titleMedium' style={{ color: MD3Colors.primary40, marginBottom: 8 }}>Calculadora</Text>

    <View style={styles.display}>
      <Text
        style={[styles.displayText, error && { color: MD3Colors.error40 }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {display}
      </Text>
    </View>

    <View style={{ gap: 6 }}>
      <View style={styles.fila}>
        <Tecla label='C' onPress={limpiar} color={MD3Colors.error40} />
        <Tecla label='⌫' onPress={borrar} />
        <Tecla label='÷' onPress={() => ingresarOperador('÷')} color={op} />
      </View>
      <View style={styles.fila}>
        <Tecla label='7' onPress={() => ingresarDigito('7')} />
        <Tecla label='8' onPress={() => ingresarDigito('8')} />
        <Tecla label='9' onPress={() => ingresarDigito('9')} />
        <Tecla label='×' onPress={() => ingresarOperador('×')} color={op} />
      </View>
      <View style={styles.fila}>
        <Tecla label='4' onPress={() => ingresarDigito('4')} />
        <Tecla label='5' onPress={() => ingresarDigito('5')} />
        <Tecla label='6' onPress={() => ingresarDigito('6')} />
        <Tecla label='-' onPress={() => ingresarOperador('-')} color={op} />
      </View>
      <View style={styles.fila}>
        <Tecla label='1' onPress={() => ingresarDigito('1')} />
        <Tecla label='2' onPress={() => ingresarDigito('2')} />
        <Tecla label='3' onPress={() => ingresarDigito('3')} />
        <Tecla label='+' onPress={() => ingresarOperador('+')} color={op} />
      </View>
      <View style={styles.fila}>
        <Tecla label='0' onPress={() => ingresarDigito('0')} />
        <Tecla label='.' onPress={ingresarPunto} />
        <Tecla label='=' onPress={igual} color={op} />
      </View>
    </View>

    <Button mode='contained' onPress={usar} style={{ marginTop: 14, borderRadius: 12 }} contentStyle={{ height: 50 }}>
      Usar
    </Button>
  </ActionSheet>
}

const styles = StyleSheet.create({
  display: {
    backgroundColor: '#f3e8ff', borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 18, marginBottom: 12, minHeight: 64, justifyContent: 'center',
  },
  displayText: { fontSize: 32, fontWeight: '600', textAlign: 'right' },
  fila: { flexDirection: 'row' },
  tecla: {
    flex: 1, marginHorizontal: 3, borderRadius: 12, height: 56,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#ece6f6',
  },
  teclaPressed: { backgroundColor: '#dcd2ee' },
  teclaLabel: { fontSize: 20, fontWeight: '500', color: '#1d1b20' },
})
