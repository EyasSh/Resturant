import ip from '../Data/Addresses'
import { useEffect, useState } from 'react'
import { ThemedView } from './ThemedView'
import { ThemedText } from './ThemedText'
import { StyleSheet, Image } from 'react-native'
import CurvedButton from '@/components/ui/CurvedButton'
import { WaiterTableProps } from '@/Types/WaiterTableProps'


/**
 * A Card component for waiters to view and manage tables.
 * 
 * @param {WaiterTableProps} props - The props of the component. Must include `tableNumber`, which is the number of the table to display.
 * @returns {JSX.Element} A JSX element representing the card component.
 */
export default function WaiterTableCard(props:WaiterTableProps) {
    return(
        <ThemedView style={styles.container}>
            <ThemedText style={styles.waiterCardText}>Table {props.tableNumber}</ThemedText>
            <CurvedButton 
                title="Wait Table" 
                action={()=>{alert("Waiting Table")}} 
                style={{backgroundColor:"#4800ff"}}
            />
            <CurvedButton 
                title="Peak Order" 
                action={()=>{alert("Peak Order")}} 
                style={{backgroundColor:"#fc9b1c"}}
            />
            
            <CurvedButton
                title='Mark order as ready'
                action={()=>{alert("Mark as ready")}}
                style={{backgroundColor:"#4800ff"}} 
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
        minHeight: 240, // ✅ replace "9%"
        minWidth: '50%',   // wider and consistent
      },
      waiterCardText: {
        fontSize: 20,
        fontWeight: 'bold',

      },
   
})