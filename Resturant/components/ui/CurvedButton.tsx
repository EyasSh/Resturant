import React from 'react';
import { Button, TouchableOpacity } from 'react-native';
import { View, Pressable,Text, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';
import { HapticTab } from '../HapticTab';
type CurvedButtonPropTypes = {
    title: string,
    action: () => void,
    style: object
}
/**
 * A button that renders a TouchableOpacity with a slight curve at the bottom.
 * The button applies haptic feedback when pressed. The button takes in a title
 * to display on the button, an action to call when the button is pressed and
 * a style to apply to the button.
 * 
 * @prop {string} title - The title of the button.
 * @prop {()=>void} action - The action to call when the button is pressed.
 * @prop {object} style - The style of the button.
 * @returns {JSX.Element} A JSX element representing the button.
 */
function CurvedButton(props: CurvedButtonPropTypes) {
    return (
        <HapticTab onPress={props.action} style={[props.style, styles.button]}>
          <Text style={styles.buttonText}>{props.title}</Text>  
        </HapticTab>
    );
}
const styles = StyleSheet.create({
    button:
    {
        width: 'auto', 
        borderRadius: 7,  
        padding: 5,
        alignItems: 'center',
        fontWeight: 'bold',
        paddingHorizontal: 15,
    },
    buttonText:
    {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 17,
    }
})
export default CurvedButton;