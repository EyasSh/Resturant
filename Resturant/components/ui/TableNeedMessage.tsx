import {useState, useEffect} from 'react';
import { StyleSheet } from 'react-native';
import {ThemedText} from '@/components/ThemedText';
import { NeedMessageProps } from '@/Types/NeedMessageProps';
import { HapticTab } from '../HapticTab';
/**
 * A component that displays a table need message as a tappable button.
 *
 * @param {NeedMessageProps} props The properties of the component.
 * @param {string} props.message The message to display on the button.
 * @param {function} [props.handleClick] The function to call when the button is pressed.
 * @returns {React.ReactElement} The component.
 */
export default function TableNeedMessage(props:NeedMessageProps) {
    
    return (
        <HapticTab style= {styles.container} onPress={()=>{if (props.handleClick) props.handleClick()
        else alert("This action is not implemented")
        }}>
            <ThemedText >{props.message}</ThemedText>
        </HapticTab>
    );
}
const styles = StyleSheet.create({
    container: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderColor: 'grey',
      borderWidth: 1,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center', // center the box itself
      maxWidth: '80%',     // prevent it from being super wide
    },
  });
  