import React from 'react';
import { useTheme } from '@react-navigation/native';
import { ThemedText } from './ThemedText';
import { TextInput, GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet,TouchableOpacity } from 'react-native';
const inputTypes:string[]=["text","password","email-address","phone-pad","date"];
type InputProps={
    type:string,
    placeholder:string,
    action?:(text:string)=>void,
    value?:string,
}
function ThemedInput(props:InputProps) {
   const {colors,dark:isDark  } = useTheme(); // Access theme colors
   const isTypeIncluded=inputTypes.includes(props.type);
    const styles = StyleSheet.create({
        input: {
            height: 40,
            width: '100%',
            borderWidth: 0.5,
            borderRadius: 10,
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