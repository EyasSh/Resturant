import React from 'react';
import { Button } from 'react-native';
import { View, Pressable,Text, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';
type CurvedButtonPropTypes = {
    title: string,
    action: () => void,
    style: object
}
function CurvedButton(props: CurvedButtonPropTypes) {
    return (
        <Pressable onPress={props.action} style={[props.style, styles.button]}>
          <Text style={styles.buttonText}>{props.title}</Text>  
        </Pressable>
    );
}
const styles = StyleSheet.create({
    button:
    {
        width: '25%', 
        borderRadius: 7,  
        padding: 5,
        alignItems: 'center',
        fontWeight: 'bold',
    },
    buttonText:
    {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 17,
    }
})
export default CurvedButton;