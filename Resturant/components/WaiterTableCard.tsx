import ip from '../Data/Addresses'
import { useEffect, useState } from 'react'
import { ThemedView } from './ThemedView'
import { ThemedText } from './ThemedText'
import { StyleSheet, Image } from 'react-native'
import CurvedButton from '@/components/ui/CurvedButton'


export default function WaiterTableCard() {
    return(
        <ThemedView style={styles.container}>
            <ThemedText>WaiterTableCard</ThemedText>
            <CurvedButton 
                title="Peak Order" 
                action={()=>{alert("Peak Order")}} 
                style={{backgroundColor:"#fc9b1c"}}
            />
            <CurvedButton
                title='Mark order as ready'
                action={()=>{alert("Mark as ready")}}
                style={{backgroundColor:"#3605fc"}} 
            />
        </ThemedView>
    )
}
const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        padding: 20,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 10,
        margin: 10,
        minHeight: 120, // ✅ replace "9%"
        width: '90%',   // wider and consistent
      },
   
})