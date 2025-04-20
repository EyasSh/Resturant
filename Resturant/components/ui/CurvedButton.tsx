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
