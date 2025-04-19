import ip from '../Data/Addresses'
import { useEffect, useState } from 'react'
import { ThemedView } from './ThemedView'
import { ThemedText } from './ThemedText'
import { StyleSheet, Image } from 'react-native'
import CurvedButton from '@/components/ui/CurvedButton'
import { WaiterTableProps } from '@/Types/WaiterTableProps'
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/Routes/NavigationTypes';



/**
 * A Card component for waiters to view and manage tables.
 * 
 * @param {WaiterTableProps} props - The props of the component. Must include `tableNumber`, which is the number of the table to display.
 * @returns {JSX.Element} A JSX element representing the card component.*/
  
export default function WaiterTableCard(props:WaiterTableProps) {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    return(
        <ThemedView style={styles.container}>
            <ThemedText style={styles.waiterCardText}>Table {props.tableNumber}</ThemedText>
            <CurvedButton 
                title="Wait Table" 
                action={() => {
                    if (props.occupyAction) props.occupyAction();
                    else alert("Waiting Table is not implemented");
                }}
                style={{backgroundColor:"#4800ff"}}
            />
            <CurvedButton 
                title="Peak Order" 
                action={() => {
                    if (props.peakOrderAction) props.peakOrderAction();
                    else alert("Peak Order is not implemented");
                }}
                
                style={{backgroundColor:"#fc9b1c"}}
            />
            <CurvedButton
                title="Peak Needs" 
                action={() => {navigation.navigate("PeakNeeds",{tableNumber:props.tableNumber})}}
                style={{backgroundColor:"#fc9b1c"}}
            />
            <CurvedButton
                title='Mark order as ready'
                action={() => {
                    if (props.markOrderReadyAction) props.markOrderReadyAction();
                    else alert("Mark Order Ready is not implemented");
                }}
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