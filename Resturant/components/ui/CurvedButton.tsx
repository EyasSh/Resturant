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