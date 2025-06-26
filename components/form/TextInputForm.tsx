import { Control, Controller, FieldValues, Path, RegisterOptions } from 'react-hook-form'
import { HelperText, TextInput, TextInputProps } from 'react-native-paper'

interface Props<T extends FieldValues> extends TextInputProps {
  control: Control<T>
  controlName: Path<T>
  rules?: RegisterOptions<T>
}

export default function TextInputForm<T extends FieldValues>({ control, controlName, rules, ...props }: Props<T>) {
  return <Controller
    rules={rules}
    // defaultValue=''
    control={control}
    name={controlName}
    render={({ field, fieldState }) => {
      return <>
        <TextInput
          {...props}
          value={field.value?.toString()}
          onBlur={field.onBlur}
          onChangeText={field.onChange}
          error={fieldState.invalid}
        />

        {fieldState.error?.message && <HelperText type='error'>
          {fieldState.error?.message}
        </HelperText>}
      </>
    }}
  />
}