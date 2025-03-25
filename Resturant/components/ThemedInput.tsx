import React from 'react';
import { useTheme } from '@react-navigation/native';
import { ThemedText } from './ThemedText';
import { TextInput, GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet,TouchableOpacity } from 'react-native';
const inputTypes:string[]=["text","password","email-address","phone-pad","date"];
type InputProps={
    type:string,
    placeholder:string,
    action?:(text:any)=>void,
    value?:string,
}
/**
 * ThemedInput is a customizable input component that adapts to the theme
 * and type specified in its props. It supports multiple input types such 
 * as text, password, email-address, and phone-pad, displaying a themed 
 * TextInput component based on the input type. If the input type is not 
 * supported, it displays an error message using ThemedText.
 *
 * @param {InputProps} props - The properties for configuring the input. 
 *  - type: Specifies the input type (text, password, email-address, phone-pad, or date).
 *  - placeholder: The placeholder text for the input field.
 *  - action: A function to handle changes in the input text.
 *  - value: The current value of the input field.
 *
 * @returns A themed TextInput wrapped in a GestureHandlerRootView, tailored 
 * to the input type with appropriate styling and behavior.
 */

function ThemedInput(props:InputProps) {
   const {colors,dark:isDark  } = useTheme(); // Access theme colors
   const isTypeIncluded=inputTypes.includes(props.type);
    const styles = StyleSheet.create({
        input: {
            height: 40,
            width: '100%',
            borderWidth: 0.5,
            borderRadius: 10,
            borderColor: isDark ? "white" : "black",
            backgroundColor: 'transparent',
            paddingHorizontal: 10,
            marginBottom: 20,
            color: isDark ? "white" : "black",
          },
          opacity:{
            width: '100%',
           justifyContent: 'center',
           alignItems: 'center',
        }
    })
   if(!isTypeIncluded){
    <ThemedText>Invalid input type</ThemedText>
   }
   if(props.type==="password"){
    return (
        <GestureHandlerRootView style={styles.input}>
            <TextInput
            secureTextEntry={true}
            placeholder={props.placeholder}
            value={props.value}
            onChangeText={props.action}
            autoCapitalize='none'
            autoCorrect={false}
            style={styles.input}
            placeholderTextColor={isDark ? "white" : "black"}

         />
        </GestureHandlerRootView>
        
    );}
    else if(props.type==="email-address"){
        return (
            <GestureHandlerRootView style={styles.input}>
                <TextInput
                placeholder={props.placeholder}
                placeholderTextColor={isDark ? "white" : "black"}
                value={props.value}
                onChangeText={props.action}
                keyboardType="email-address"
                style={styles.input}
                autoCapitalize='none'
                autoCorrect={false}
             />
            </GestureHandlerRootView>
            
        );
    }
    else if(props.type==="phone-pad"){
        return (
            <GestureHandlerRootView style={styles.input}>
                <TextInput
                    placeholder={props.placeholder}
                    placeholderTextColor={isDark ? "white" : "black"}
                    value={props.value}
                    onChangeText={props.action}
                    keyboardType="phone-pad"
                    style={styles.input}
                    autoCapitalize='none'
                    autoCorrect={false}
                />
            </GestureHandlerRootView>
        );
    }
    else
    {
        return (
             /* Open Date Picker */
             <GestureHandlerRootView style={styles.input}>
                 <TextInput
                    placeholder={props.placeholder}
                    placeholderTextColor={isDark ? "white" : "black"}
                    value={props.value}
                    onChangeText={props.action}
                    keyboardType='default'
                    style={styles.input}
                    autoCapitalize='none'
                    autoCorrect={false}
                 />
             </GestureHandlerRootView>
            
        );
    }
}

export default ThemedInput;