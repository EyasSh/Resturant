import React from 'react'
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native'

type CurvedButtonPropTypes = {
  title: string
  action: () => void
  style?: StyleProp<ViewStyle>
}

/**
 * A button with a rounded rectangle shape and a drop shadow.
 * @param {{title: string, action: () => void, style?: StyleProp<ViewStyle>}} props
 * @prop {string} title - The text to display on the button.
 * @prop {() => void} action - The function to call when the button is pressed.
 * @prop {StyleProp<ViewStyle>} style - An optional style object to customize the button's appearance.
 * The button will use the backgroundColor from this object as the color of its drop shadow.
 * @returns {JSX.Element} A TouchableOpacity component with the button's style and title.
 */
export default function CurvedButton(props: CurvedButtonPropTypes) {
  // flatten into a real object so we can read backgroundColor
  const flat: ViewStyle = StyleSheet.flatten(props.style) || {}
  const shadowClr = flat.backgroundColor ?? 'black'

  const styles = StyleSheet.create({
    button: {
      width: 'auto',
      borderRadius: 7,
      
      padding: 5,
      alignItems: 'center',
      fontWeight: 'bold',
      paddingHorizontal: 15,
      shadowColor: shadowClr,
      shadowOffset: { width: 5, height: 5 },
      shadowOpacity: 1,
      shadowRadius: 10,
      elevation: 15, // Required for Android shadow
      zIndex: 10,
    },
    buttonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 17,
    },
  })

  return (
    <TouchableOpacity onPress={props.action} style={[props.style, styles.button]}>
      <Text style={styles.buttonText}>{props.title}</Text>
    </TouchableOpacity>
  )
}
