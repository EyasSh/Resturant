import {useState, useEffect} from 'react';
import { StyleSheet } from 'react-native';
import {ThemedText} from '@/components/ThemedText';
import { NeedMessageProps } from '@/Types/NeedMessageProps';
import { HapticTab } from '../HapticTab';
export default function TableNeedMessage(props:NeedMessageProps) {
    
    return (
        <HapticTab style= {styles.container} onPress={()=>props.handleClick()}>
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
  