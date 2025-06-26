import { Children, cloneElement, isValidElement, PropsWithChildren, useState } from 'react'
import { IconButton, Menu } from 'react-native-paper'

interface OpcionesMenuProps extends PropsWithChildren {
}
export function OpcionesMenu({ children }: OpcionesMenuProps) {
  const [visible, setVisible] = useState(false)

  const openMenu = () => setVisible(true)

  const closeMenu = () => setVisible(false)

  // Clona los hijos para inyectar la función closeMenu en sus props onPress
  const childrenWithProps = Children.map(children, child => {
    // Asegúrate de que el hijo sea un elemento React válido y que sus props puedan tener 'onPress'
    if (isValidElement(child)) {
      // Afirmamos que el tipo de las props del hijo incluye 'onPress' y es una función
      // Y también que el tipo del hijo es un React.ReactElement con unas props genéricas
      const typedChild = child as React.ReactElement<{ onPress?: () => void }>

      return cloneElement(typedChild, {
        onPress: () => {
          // Ejecuta la función original de onPress del Menu.Item si existe
          if (typedChild.props.onPress) {
            typedChild.props.onPress()
          }
          closeMenu()
        },
      })
    }
    return child
  })

  return <Menu
    visible={visible}
    onDismiss={closeMenu}
    anchorPosition='bottom'
    anchor={<IconButton icon='dots-vertical' onPress={openMenu} />}
  >
    {childrenWithProps}
  </Menu>
}